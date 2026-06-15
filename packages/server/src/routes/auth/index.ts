import type { UserProfile } from '@ypm/shared'
import { sql } from 'bun'
import { google } from 'googleapis'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { config } from '../../config'

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUrl
)

const SESSION_ID = 'session_id'

export default new Hono()
  .get('/login', c => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ]
    })
    return c.redirect(url)
  })

  .get('/callback', async c => {
    const code = c.req.query('code')
    if (!code) return c.json({ error: 'No code provided' }, 400)

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()

    const [user] = await sql<
      { id: string }[]
    >`INSERT INTO users (google_id, email, name, picture, access_token, refresh_token)
      VALUES (${data.id}, ${data.email}, ${data.name}, ${data.picture}, ${tokens.access_token}, ${tokens.refresh_token}) 
      ON CONFLICT (google_id) DO UPDATE SET
        email = ${data.email},
        name = ${data.name},
        picture = ${data.picture},
        access_token = ${tokens.access_token},
        refresh_token = COALESCE(${tokens.refresh_token}, users.refresh_token),
        updated_at = NOW()
      RETURNING id
    `

    if (!user?.id) return c.json({ error: 'Failed to create user' }, 500)

    const [session] = await sql<
      { id: string }[]
    >`INSERT INTO sessions (user_id, expires_at)
      VALUES (${user.id}, NOW() + INTERVAL '7 days')
      RETURNING id
    `

    if (!session?.id) return c.json({ error: 'Failed to create session' }, 500)

    setCookie(c, SESSION_ID, session.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })
    return c.redirect(config.webUrl)
  })

  .get('/me', async c => {
    const sessionId = getCookie(c, SESSION_ID)
    if (!sessionId) return c.json(null)

    const [user] = await sql<UserProfile[]>`
      SELECT u.id, u.email, u.name, u.picture
      FROM sessions s 
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `

    return c.json(user ?? null)
  })

  .get('/logout', async c => {
    const sessionId = getCookie(c, SESSION_ID)
    if (sessionId) {
      await sql`
        DELETE FROM sessions WHERE id = ${sessionId}
      `
      deleteCookie(c, SESSION_ID, { path: '/' })
    }
    return c.redirect(config.webUrl)
  })
