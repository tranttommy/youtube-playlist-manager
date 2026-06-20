import { sql } from 'bun'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { SESSION_COOKIE } from '../../config'

export type UserIdEnv = {
  Variables: {
    userId: string
  }
}

export const withUserId = createMiddleware<UserIdEnv>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) return c.json({ error: 'No user authenticated' }, 401)

  const [session] = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM sessions
      WHERE id = ${sessionId} AND expires_at > NOW()
    `
  if (!session) return c.json({ error: 'No session found' }, 401)

  c.set('userId', session.user_id)

  await next()
})
