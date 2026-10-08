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
  webUrl: required('WEB_URL')
}

export const SESSION_COOKIE = 'session_id'
