import { Hono } from 'hono'
import api from './routes/api'
import auth from './routes/auth'

export default new Hono()
  .get('/', c => c.text('Hello Hono!'))
  .route('/auth', auth)
  .route('/api', api)
