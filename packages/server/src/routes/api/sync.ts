import type { Playlist } from '@ypm/shared'
import { sql } from 'bun'
import type { youtube_v3 } from 'googleapis'
import { google } from 'googleapis'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { createAuthClient } from '../../lib'

interface YouTubeEnv {
  Variables: {
    user: { id: string }
    youtube: ReturnType<typeof google.youtube>
  }
}

export default new Hono<YouTubeEnv>()
  .use(async (c, next) => {
    const sessionId = getCookie(c, 'session_id')
    if (!sessionId) return c.json({ error: 'No user authenticated' }, 401)

    const [user] = await sql<
      { id: string; access_token: string; refresh_token: string }[]
    >`
      SELECT u.id, u.access_token, u.refresh_token
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `
    if (!user) return c.json({ error: 'No user authenticated' }, 401)

    const authClient = createAuthClient()
    authClient.setCredentials(user)

    const youtube = google.youtube({ version: 'v3', auth: authClient })

    c.set('user', user)
    c.set('youtube', youtube)
    await next()
  })

  .get('/pull', async c => {
    const user = c.get('user')
    const youtube = c.get('youtube')

    const items: youtube_v3.Schema$Playlist[] = []
    let pageToken: string | undefined
    do {
      const { data } = await youtube.playlists.list({
        mine: true,
        part: ['id', 'contentDetails', 'snippet'],
        maxResults: 10,
        pageToken
      })
      items.push(...(data.items ?? []))
      pageToken = data.nextPageToken ?? undefined
    } while (pageToken)

    const playlists = await sql.begin(async tx => {
      const playlists: Playlist[] = []
      for (const item of items) {
        const [playlist] = await tx<Playlist[]>`
          INSERT INTO playlists (youtube_id, user_id, title, thumbnail, item_count, published_at)
          VALUES (${item.id}, ${user.id}, ${item.snippet?.title}, ${item.snippet?.thumbnails?.medium?.url}, ${item.contentDetails?.itemCount}, ${item.snippet?.publishedAt})
          ON CONFLICT (youtube_id) DO UPDATE SET
            title = EXCLUDED.title,
            thumbnail = EXCLUDED.thumbnail,
            item_count = EXCLUDED.item_count,
            updated_at = NOW()
          RETURNING id, title, thumbnail, item_count, published_at
        `
        playlist && playlists.push(playlist)
      }
      return playlists
    })

    return c.json(playlists)
  })
