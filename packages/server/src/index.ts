import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { AppError } from './errors'
import api from './routes/api'
import auth from './routes/auth'

export default new Hono()
  .use(logger())
  .route('/auth', auth)
  .route('/api', api)
  .onError((e, c) => {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)

    console.error('Unhandled error:', e)
    return c.json({ error: 'Internal server error' }, 500)
  })
