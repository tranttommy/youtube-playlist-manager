import { Hono } from 'hono'
import { logger } from 'hono/logger'
import api from './routes/api'
import auth from './routes/auth'

export default new Hono()
  .use(logger())
  .get('/', c => c.text('Hello Hono!'))
  .route('/auth', auth)
  .route('/api', api)
