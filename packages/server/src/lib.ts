import { google } from 'googleapis'
import { config } from './config'

export const createAuthClient = () =>
  new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUrl
  )
