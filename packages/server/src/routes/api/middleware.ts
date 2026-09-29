import { sql } from 'bun'
import { google } from 'googleapis'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { SESSION_COOKIE } from '../../config'
import { Errors } from '../../errors'
import { createAuthClient } from '../../lib'

export type UserIdEnv = {
  Variables: {
    userId: string
  }
}

export type YouTubeEnv = {
  Variables: {
    youtube: ReturnType<typeof google.youtube>
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

export const withYouTube = createMiddleware<UserIdEnv & YouTubeEnv>(
  async (c, next) => {
    const userId = c.get('userId')

    const [tokens] = await sql<
      { access_token: string; refresh_token: string }[]
    >`
      SELECT access_token, refresh_token
      FROM users
      WHERE id = ${userId}
    `
    if (!tokens)
      throw Errors.unauthorized('YouTube connection lost, please sign in again')

    const authClient = createAuthClient()
    authClient.setCredentials(tokens)
    authClient.on('tokens', async t => {
      if (t.access_token) {
        await sql`
          UPDATE users
          SET access_token = ${t.access_token},
              updated_at = NOW()
          WHERE id = ${userId}
        `
      }
    })

    c.set('youtube', google.youtube({ version: 'v3', auth: authClient }))
    await next()
  }
)
