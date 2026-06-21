import { Hono } from 'hono'
import { withAuth } from './middleware'
import playlists from './playlists'
import sync from './sync'

export default new Hono()
  .use(withAuth)
  .route('/sync', sync)
  .route('/playlists', playlists)
