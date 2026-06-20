import type { Playlist } from '@ypm/shared'
import { sql } from 'bun'
import { Hono } from 'hono'
import type { UserIdEnv } from './middleware'

export default new Hono<UserIdEnv>().get('/', async c => {
  const userId = c.get('userId')
  const playlists = await sql<Playlist[]>`
    SELECT id, title, thumbnail, item_count, published_at
    FROM playlists
    WHERE user_id = ${userId}
  `
  return c.json(playlists)
})
