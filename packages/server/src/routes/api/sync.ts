import { sql } from 'bun'
import type { youtube_v3 } from 'googleapis'
import { google } from 'googleapis'
import { Hono } from 'hono'
import { Errors } from '../../errors'
import { createAuthClient } from '../../lib'
import type { UserIdEnv } from './middleware'

type YouTubeEnv = UserIdEnv & {
  Variables: UserIdEnv['Variables'] & {
    youtube: ReturnType<typeof google.youtube>
  }
}

export default new Hono<YouTubeEnv>()
  .use(async (c, next) => {
    const userId = c.get('userId')

    const [tokens] = await sql<
      { access_token: string; refresh_token: string }[]
    >`
      SELECT access_token, refresh_token
      FROM users
      WHERE id = ${userId}
    `
    if (!tokens)
      throw Errors.unauthorized('YouTube connection lost, please sign in again')

    const authClient = createAuthClient()
    authClient.setCredentials(tokens)
    c.set('youtube', google.youtube({ version: 'v3', auth: authClient }))
    await next()
  })

  .post('/pull', async c => {
    const userId = c.get('userId')
    const youtube = c.get('youtube')

    const items: youtube_v3.Schema$Playlist[] = []

    try {
      let pageToken: string | undefined
      do {
        const { data } = await youtube.playlists.list({
          mine: true,
          part: ['id', 'contentDetails', 'snippet'],
          maxResults: 50,
          pageToken
        })
        items.push(...(data.items ?? []))
        pageToken = data.nextPageToken ?? undefined
      } while (pageToken)
    } catch {
      throw Errors.upstream('Failed to fetch playlists from YouTube')
    }

    const playlists = await sql.begin(async tx => {
      const playlists: { id: string }[] = []
      for (const item of items) {
        const [playlist] = await tx<{ id: string }[]>`
          INSERT INTO playlists (youtube_id, user_id, title, thumbnail, item_count, published_at)
          VALUES (${item.id}, ${userId}, ${item.snippet?.title}, ${item.snippet?.thumbnails?.medium?.url}, ${item.contentDetails?.itemCount}, ${item.snippet?.publishedAt})
          ON CONFLICT (youtube_id) DO UPDATE SET
            title = EXCLUDED.title,
            thumbnail = EXCLUDED.thumbnail,
            item_count = EXCLUDED.item_count,
            updated_at = NOW()
          RETURNING id
        `
        if (playlist) playlists.push(playlist)
      }
      return playlists
    })

    return c.json({ playlistsSynced: playlists.length })
  })

  .post('/pull/:id', async c => {
    const playlistId = c.req.param('id')
    const userId = c.get('userId')
    const youtube = c.get('youtube')

    const [playlist] = await sql<{ youtube_id: string }[]>`
      SELECT youtube_id
      FROM playlists
      WHERE id = ${playlistId} AND user_id = ${userId}
    `
    if (!playlist) throw Errors.notFound()

    const items: youtube_v3.Schema$PlaylistItem[] = []

    try {
      let pageToken: string | undefined
      do {
        const { data } = await youtube.playlistItems.list({
          playlistId: playlist.youtube_id,
          part: ['id', 'snippet'],
          maxResults: 50,
          pageToken
        })
        items.push(...(data.items ?? []))
        pageToken = data.nextPageToken ?? undefined
      } while (pageToken)
    } catch (e) {
      console.error(e)
      throw Errors.upstream('Failed to fetch playlist items from YouTube')
    }

    const playlistItems = await sql.begin(async tx => {
      const channelIds = new Map<string, string>()
      const playlistItems: { id: string }[] = []
      for (const item of items) {
        const ytChannelId = item.snippet?.videoOwnerChannelId
        let channelId: string | null = null

        if (ytChannelId) {
          channelId = channelIds.get(ytChannelId) ?? null
          if (!channelId) {
            const [channel] = await tx<{ id: string }[]>`
              INSERT INTO channels (youtube_id, title)
              VALUES (${ytChannelId}, ${item.snippet?.videoOwnerChannelTitle})
              ON CONFLICT (youtube_id) DO UPDATE SET
                title = EXCLUDED.title
              RETURNING id
            `
            if (channel) {
              channelIds.set(ytChannelId, channel.id)
              channelId = channel.id
            }
          }
        }

        const [playlistItem] = await tx<{ id: string }[]>`
          INSERT INTO playlist_items (youtube_id, video_youtube_id, playlist_id, channel_id, title, thumbnail, published_at)
          VALUES (${item.id}, ${item.snippet?.resourceId?.videoId}, ${playlistId}, ${channelId}, ${item.snippet?.title}, ${item.snippet?.thumbnails?.medium?.url}, ${item.snippet?.publishedAt})
          ON CONFLICT (youtube_id) DO UPDATE SET
            title = EXCLUDED.title,
            thumbnail = EXCLUDED.thumbnail,
            updated_at = NOW()
          RETURNING id
        `
        if (playlistItem) playlistItems.push(playlistItem)
      }
      return playlistItems
    })

    return c.json({ playlistItemsSynced: playlistItems.length })
  })
