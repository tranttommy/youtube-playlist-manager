import { sql } from 'bun'
import type { youtube_v3 } from 'googleapis'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { Errors } from '../../errors'
import { type UserIdEnv, withYouTube, type YouTubeEnv } from './middleware'

export default new Hono<UserIdEnv & YouTubeEnv>()
  .use(withYouTube)
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

    const [playlist] = await sql<{ youtube_id: string; item_count: number }[]>`
      SELECT youtube_id, item_count
      FROM playlists
      WHERE id = ${playlistId} AND user_id = ${userId}
    `
    if (!playlist) throw Errors.notFound()

    return streamSSE(c, async stream => {
      const channelIds = new Map<string, string>()
      let processed = 0
      const total = playlist.item_count

      try {
        let pageToken: string | undefined
        do {
          // Fetch one page from YouTube
          const { data } = await youtube.playlistItems.list({
            playlistId: playlist.youtube_id,
            part: ['id', 'snippet'],
            maxResults: 50,
            pageToken
          })
          const items = data.items ?? []

          // Upsert this page (one transaction per page)
          await sql.begin(async tx => {
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

              await tx`
                INSERT INTO playlist_items (youtube_id, video_youtube_id, playlist_id, channel_id, title, thumbnail, published_at)
                VALUES (${item.id}, ${item.snippet?.resourceId?.videoId}, ${playlistId}, ${channelId}, ${item.snippet?.title}, ${item.snippet?.thumbnails?.medium?.url}, ${item.snippet?.publishedAt})
                ON CONFLICT (youtube_id) DO UPDATE SET
                  title = EXCLUDED.title,
                  thumbnail = EXCLUDED.thumbnail,
                  updated_at = NOW()
              `
            }
          })

          // Emit progress for this page
          processed += items.length
          await stream.writeSSE({
            event: 'progress',
            data: JSON.stringify({ processed, total })
          })

          pageToken = data.nextPageToken ?? undefined
        } while (pageToken)

        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify({ playlistItemsSynced: processed })
        })
      } catch (e) {
        // Failure becomes an event, not a status code
        console.error(e)
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ message: 'Failed to sync playlist items' })
        })
      }
    })
  })

  .post('/delete/:id', async c => {
    const playlistId = c.req.param('id')
    const userId = c.get('userId')
    const youtube = c.get('youtube')

    const selectedIds = await c.req.json<string[]>()

    // Get youtube_id
    const items = await sql<{ id: string; youtube_id: string }[]>`
      SELECT pi.id, pi.youtube_id
      FROM playlist_items pi
      JOIN playlists pl ON pl.id = pi.playlist_id
      WHERE pi.id = ANY(${sql.array(selectedIds, 'TEXT')}::uuid[])
        AND pi.playlist_id = ${playlistId}
        AND pl.user_id = ${userId}
    `

    const deletedIds: string[] = []
    for (const item of items) {
      await youtube.playlistItems.delete({ id: item.youtube_id })
      deletedIds.push(item.id)
    }

    // Delete from database
    await sql`DELETE FROM playlist_items WHERE id = ANY(${sql.array(deletedIds, 'TEXT')}::uuid[])`

    return c.json({ deleted: deletedIds.length })
  })
