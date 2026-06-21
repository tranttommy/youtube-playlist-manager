import { sql } from 'bun'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { SESSION_COOKIE } from '../../config'
import { Errors } from '../../errors'

export type UserIdEnv = {
  Variables: {
    userId: string
  }
}

export const withAuth = createMiddleware<UserIdEnv>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) throw Errors.unauthorized()

  const [session] = await sql<{ user_id: string }[]>`
    SELECT user_id
    FROM sessions
    WHERE id = ${sessionId} AND expires_at > NOW()
  `
  if (!session) throw Errors.unauthorized()

  c.set('userId', session.user_id)
  await next()
})
