import type { YoutubeError } from './types'

// server/src/quota.ts
const pacificDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles'
  }).format(new Date())

let exhaustedOn: string = ''

export const markQuotaExhausted = () => {
  exhaustedOn = pacificDate()
}

export const isQuotaExhausted = () => exhaustedOn === pacificDate()

export const checkQuotaExhausted = (e: unknown) => {
  const err = e as YoutubeError
  return (
    err.cause?.errors?.some(error => error.reason === 'quotaExceeded') ?? false
  )
}
