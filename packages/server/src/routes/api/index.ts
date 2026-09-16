import { Hono } from 'hono'
import { withAuth } from './middleware'
import playlists from './playlists'
import youtube from './youtube'

export default new Hono()
  .use(withAuth)
  .route('/youtube', youtube)
  .route('/playlists', playlists)
