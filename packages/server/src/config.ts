function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const config = {
  google: {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    redirectUrl: required('GOOGLE_REDIRECT_URL')
  },
  webUrl: process.env.WEB_URL || '/',
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV
}

export const SESSION_COOKIE = 'session_id'
