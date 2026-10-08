import { Hono } from 'hono'
import { isQuotaExhausted } from '../../quota'
import { withAuth } from './middleware'
import playlists from './playlists'
import youtube from './youtube'

export default new Hono()
  .use(withAuth)
  .get('/quota', c => c.json({ isQuotaExhausted: isQuotaExhausted() }))
  .route('/youtube', youtube)
  .route('/playlists', playlists)
