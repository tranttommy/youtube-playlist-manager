import { describe, expect, test } from 'bun:test'
import { checkQuotaExhausted } from './quota'

describe('checkQuotaExhausted', () => {
  test('when there is quotaExceeded error', () => {
    const e = { cause: { errors: [{ reason: 'quotaExceeded' }] } }
    expect(checkQuotaExhausted(e)).toBeTrue()
  })

  test('ignores other YouTube errors', () => {
    const e = { cause: { errors: [{ reason: 'forbidden' }] } }
    expect(checkQuotaExhausted(e)).toBe(false)
  })

  test('returns false on other errors', () => {
    expect(checkQuotaExhausted(new Error('network failure'))).toBe(false)
  })
})
