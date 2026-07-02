import type { Playlist, PlaylistItem } from '@ypm/shared'
import { sql } from 'bun'
import { Hono } from 'hono'
import type { UserIdEnv } from './middleware'

export default new Hono<UserIdEnv>()
  .get('/', async c => {
    const userId = c.get('userId')
    const playlists = await sql<Playlist[]>`
      SELECT id, title, thumbnail, item_count, published_at
      FROM playlists
      WHERE user_id = ${userId}
    `
    return c.json(playlists)
  })

  .get(':id/items', async c => {
    const userId = c.get('userId')
    const playlistId = c.req.param('id')
    const playlistItems = await sql<PlaylistItem[]>`
      SELECT pi.id, pi.title, pi.thumbnail, c.title AS channel_title, c.id AS channel_id
      FROM playlist_items pi
      LEFT JOIN channels c ON pi.channel_id = c.id
      JOIN playlists pl ON pl.id = pi.playlist_id
      WHERE pi.playlist_id = ${playlistId} AND pl.user_id = ${userId}
    `
    return c.json(playlistItems)
  })
