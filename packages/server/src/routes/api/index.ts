import { Hono } from 'hono'
import { withUserId } from './middleware'
import playlists from './playlists'
import sync from './sync'

export default new Hono()
  .use(withUserId)
  .route('/sync', sync)
  .route('/playlists', playlists)
