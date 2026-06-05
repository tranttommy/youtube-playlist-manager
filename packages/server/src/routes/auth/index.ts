import { google } from 'googleapis'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { config } from '../../config'

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUrl
)

const sessions = new Map<
  string,
  {
    id?: string | null
    givenName?: string | null
    familyName?: string | null
  }
>()

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

    const sessionId = crypto.randomUUID()
    sessions.set(sessionId, {
      id: data.id,
      givenName: data.given_name,
      familyName: data.family_name
    })
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })
    return c.redirect(config.webUrl)
  })

  .get('/me', c => {
    const sessionId = getCookie(c, 'session_id')
    if (!sessionId) return c.json(null)
    const user = sessions.get(sessionId)
    return c.json(user)
  })

  .get('/logout', c => {
    const sessionId = getCookie(c, 'session_id')
    if (sessionId) {
      sessions.delete(sessionId)
      deleteCookie(c, 'session_id', { path: '/' })
    }
    return c.redirect(config.webUrl)
  })
