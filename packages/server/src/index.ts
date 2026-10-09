import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { config } from './config'
import { AppError } from './errors'
import api from './routes/api'
import auth from './routes/auth'

const distPath = join(import.meta.dir, '../../web/dist')

const app = new Hono()
  .use(logger())
  .route('/auth', auth)
  .route('/api', api)
  .use('/*', serveStatic({ root: distPath }))
  .use('/*', serveStatic({ path: join(distPath, 'index.html') }))
  .onError((e, c) => {
    if (e instanceof AppError) return c.json({ error: e.message }, e.status)

    console.error('Unhandled error:', e)
    return c.json({ error: 'Internal server error' }, 500)
  })

export default {
  port: config.port,
  fetch: app.fetch
}
