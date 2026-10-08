import { sql } from 'bun'
import type { youtube_v3 } from 'googleapis'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getPlaylistItemsYoutubeIds } from '../../db/queries'
import { Errors } from '../../errors'
import { checkQuotaExhausted, markQuotaExhausted } from '../../quota'
import { type UserIdEnv, withYouTube, type YouTubeEnv } from './middleware'

export default new Hono<UserIdEnv & YouTubeEnv>()
  .use(withYouTube)
  .post('/pull', async c => {
    const userId = c.get('userId')
    const youtube = c.get('youtube')

    const ytPlaylists: youtube_v3.Schema$Playlist[] = []
    try {
      let pageToken: string | undefined
      do {
        const { data } = await youtube.playlists.list({
          mine: true,
          part: ['id', 'contentDetails', 'snippet'],
          maxResults: 50,
          pageToken
        })
        ytPlaylists.push(...(data.items ?? []))
        pageToken = data.nextPageToken ?? undefined
      } while (pageToken)
    } catch {
      throw Errors.upstream('Failed to fetch playlists from YouTube')
    }

    if (!ytPlaylists.length) return c.json({ succeeded: 0 })

    const rows = ytPlaylists.map(p => ({
      youtube_id: p.id,
      user_id: userId,
      title: p.snippet?.title,
      thumbnail: p.snippet?.thumbnails?.medium?.url,
      item_count: p.contentDetails?.itemCount,
      published_at: p.snippet?.publishedAt
    }))

    const succeeded = await sql.begin(async tx => {
      const playlists = await tx<{ youtube_id: string }[]>`
          INSERT INTO playlists ${sql(rows, 'youtube_id', 'user_id', 'title', 'thumbnail', 'item_count', 'published_at')}
          ON CONFLICT (youtube_id) DO UPDATE SET
            title = EXCLUDED.title,
            thumbnail = EXCLUDED.thumbnail,
            item_count = EXCLUDED.item_count,
            updated_at = NOW()
          RETURNING youtube_id
        `

      // Deletes playlists that are no longer on YouTube
      await tx`
          DELETE FROM playlists
          WHERE user_id = ${userId} AND youtube_id != ALL(${sql.array(
            playlists.map(p => p.youtube_id),
            'TEXT'
          )})
        `
      return playlists.length
    })

    return c.json({ succeeded })
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
      const processedYtItemIds: string[] = []
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
          if (!items.length) break

          // Filter for dupe channels before inserting channels
          const channelRows: {
            youtube_id: string
            title: string
          }[] = []

          for (const item of items) {
            const ytChannelId = item.snippet?.videoOwnerChannelId
            if (!ytChannelId || channelIds.has(ytChannelId)) continue
            channelIds.set(ytChannelId, '')
            channelRows.push({
              youtube_id: ytChannelId,
              title: item.snippet?.videoOwnerChannelTitle as string
            })
          }

          await sql.begin(async tx => {
            if (channelRows.length) {
              const channels = await tx<{ id: string; youtube_id: string }[]>`
                INSERT INTO channels ${sql(channelRows, 'youtube_id', 'title')}
                ON CONFLICT (youtube_id) DO UPDATE SET
                  title = EXCLUDED.title
                RETURNING id, youtube_id
              `
              channels.forEach(({ id, youtube_id }) => {
                channelIds.set(youtube_id, id)
              })
            }

            const playlistItemRows = items.map(item => ({
              youtube_id: item.id,
              youtube_video_id: item.snippet?.resourceId?.videoId,
              playlist_id: playlistId,
              channel_id:
                channelIds.get(item.snippet?.videoOwnerChannelId as string)
                || null,
              title: item.snippet?.title,
              thumbnail: item.snippet?.thumbnails?.medium?.url,
              published_at: item.snippet?.publishedAt
            }))

            const newItems = await tx<{ youtube_id: string }[]>`
                INSERT INTO playlist_items ${sql(playlistItemRows, 'youtube_id', 'youtube_video_id', 'playlist_id', 'channel_id', 'title', 'thumbnail', 'published_at')}            
                ON CONFLICT (youtube_id) DO UPDATE SET
                  title = EXCLUDED.title,
                  thumbnail = EXCLUDED.thumbnail,
                  updated_at = NOW()
                RETURNING youtube_id
              `
            processedYtItemIds.push(...newItems.map(item => item.youtube_id))
          })
          // Emit progress for this page
          await stream.writeSSE({
            event: 'progress',
            data: JSON.stringify({
              processed: processedYtItemIds.length,
              total
            })
          })

          pageToken = data.nextPageToken ?? undefined
        } while (pageToken)

        await sql.begin(async tx => {
          await tx`
            DELETE FROM playlist_items
            WHERE playlist_id = ${playlistId}
              AND youtube_id != ALL(${sql.array(processedYtItemIds, 'TEXT')})
          `
          await tx`
            UPDATE playlists
            SET item_count = ${processedYtItemIds.length},
              updated_at = NOW()
            WHERE id = ${playlistId} AND user_id = ${userId}
          `
        })

        return stream.writeSSE({
          event: 'done',
          data: JSON.stringify({ succeeded: processedYtItemIds.length })
        })
      } catch (e) {
        // Failure becomes an event, not a status code
        console.error(e)
        return stream.writeSSE({
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
    const { selectedIds } = await c.req.json<{ selectedIds: string[] }>()

    if (!Array.isArray(selectedIds) || !selectedIds.length)
      throw Errors.badRequest('Expected a non-empty array of item ids')

    // Get YouTube IDs
    const items = await getPlaylistItemsYoutubeIds(
      sql,
      selectedIds,
      playlistId,
      userId
    )
    if (!items.length) throw Errors.notFound('Selected IDs not found')

    return streamSSE(c, async stream => {
      const deletedIds: string[] = []

      for (const item of items) {
        try {
          await youtube.playlistItems.delete({ id: item.youtube_id })
          deletedIds.push(item.id)
        } catch (e) {
          if (checkQuotaExhausted(e)) {
            markQuotaExhausted()
            return stream.writeSSE({
              event: 'error',
              data: JSON.stringify({
                message:
                  'Daily YouTube quota exhausted. Resets at midnight Pacific.'
              })
            })
          }
        }

        await stream.writeSSE({
          event: 'progress',
          data: JSON.stringify({
            processed: deletedIds.length,
            total: items.length
          })
        })
      }

      // Delete from database and update playlist count
      try {
        if (deletedIds.length) {
          await sql.begin(async tx => {
            await tx`
              DELETE FROM playlist_items
              WHERE id = ANY(${sql.array(deletedIds, 'TEXT')}::uuid[])
            `
            await tx`
              UPDATE playlists
              SET item_count = GREATEST(0, item_count - ${deletedIds.length}),
                updated_at = NOW()
              WHERE id = ${playlistId}
            `
          })
        }
      } catch (e) {
        console.error(e)
        return stream.writeSSE({
          event: 'error',
          data: JSON.stringify({
            message: `Deleted ${deletedIds.length} from YouTube, but failed to update locally. Re-sync this playlist.`
          })
        })
      }

      return stream.writeSSE({
        event: 'done',
        data: JSON.stringify({
          succeeded: deletedIds.length,
          failed: items.length - deletedIds.length
        })
      })
    })
  })

  .post('/move/:id', async c => {
    const playlistId = c.req.param('id')
    const userId = c.get('userId')
    const youtube = c.get('youtube')
    const { selectedIds, targetPlaylistId } = await c.req.json<{
      selectedIds: string[]
      targetPlaylistId: string
    }>()

    if (!Array.isArray(selectedIds) || !selectedIds.length)
      throw Errors.badRequest('Expected a non-empty array of item ids')

    const [targetPlaylist] = await sql<{ youtube_id: string }[]>`
      SELECT youtube_id
      FROM playlists
      WHERE id = ${targetPlaylistId} AND user_id = ${userId}
    `
    if (!targetPlaylist) throw Errors.notFound('Target playlist not found')

    // Get YouTube IDs
    const items = await getPlaylistItemsYoutubeIds(
      sql,
      selectedIds,
      playlistId,
      userId
    )
    if (!items.length) throw Errors.notFound('Selected IDs not found')

    return streamSSE(c, async stream => {
      const movedIds: string[] = []
      for (const item of items) {
        try {
          const { data: newYtPlaylistItem } =
            await youtube.playlistItems.insert({
              part: ['snippet'],
              requestBody: {
                snippet: {
                  playlistId: targetPlaylist.youtube_id,
                  resourceId: {
                    kind: 'youtube#video',
                    videoId: item.youtube_video_id
                  }
                }
              }
            })
          await sql`
            UPDATE playlist_items
            SET youtube_id = ${newYtPlaylistItem.id},
              playlist_id = ${targetPlaylistId},        
              updated_at = NOW()
            WHERE id = ${item.id}
          `
          await youtube.playlistItems.delete({ id: item.youtube_id })
          movedIds.push(item.id)
        } catch (e) {
          if (checkQuotaExhausted(e)) {
            markQuotaExhausted()
            return stream.writeSSE({
              event: 'error',
              data: JSON.stringify({
                message:
                  'Daily YouTube quota exhausted. Resets at midnight Pacific.'
              })
            })
          }
        }
        await stream.writeSSE({
          event: 'progress',
          data: JSON.stringify({
            processed: movedIds.length,
            total: items.length
          })
        })
      }

      try {
        if (movedIds.length) {
          await sql.begin(async tx => {
            await tx`
                UPDATE playlists
                SET item_count = GREATEST(0, item_count - ${movedIds.length}), updated_at = NOW()
                WHERE id = ${playlistId}
              `
            await tx`
                UPDATE playlists
                SET item_count = item_count + ${movedIds.length}, updated_at = NOW()
                WHERE id = ${targetPlaylistId}
              `
          })
        }
      } catch (e) {
        console.error(e)
      }

      return stream.writeSSE({
        event: 'done',
        data: JSON.stringify({
          succeeded: movedIds.length,
          failed: items.length - movedIds.length
        })
      })
    })
  })
