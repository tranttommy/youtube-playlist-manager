import type { Playlist } from '@ypm/shared'
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
      const playlists: Playlist[] = []
      for (const item of items) {
        const [playlist] = await tx<Playlist[]>`
          INSERT INTO playlists (youtube_id, user_id, title, thumbnail, item_count, published_at)
          VALUES (${item.id}, ${userId}, ${item.snippet?.title}, ${item.snippet?.thumbnails?.medium?.url}, ${item.contentDetails?.itemCount}, ${item.snippet?.publishedAt})
          ON CONFLICT (youtube_id) DO UPDATE SET
            title = EXCLUDED.title,
            thumbnail = EXCLUDED.thumbnail,
            item_count = EXCLUDED.item_count,
            updated_at = NOW()
          RETURNING id, title, thumbnail, item_count, published_at
        `
        if (playlist) playlists.push(playlist)
      }
      return playlists
    })

    return c.json({ playlistsSynced: playlists.length })
  })
