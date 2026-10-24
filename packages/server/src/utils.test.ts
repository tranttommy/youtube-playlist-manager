import { describe, expect, test } from 'bun:test'
import { parseDuration } from './utils'

describe('parseDuration', () => {
  test('parses minutes and seconds', () => {
    expect(parseDuration('PT4M13S')).toBe(253)
  })

  test('parses hours, minutes, and seconds', () => {
    expect(parseDuration('PT1H2M3S')).toBe(3723)
  })

  test('parses seconds only', () => {
    expect(parseDuration('PT45S')).toBe(45)
  })

  test('parses hours with no minutes or seconds', () => {
    expect(parseDuration('PT1H')).toBe(3600)
  })

  test('parses hours and seconds with minutes omitted', () => {
    expect(parseDuration('PT2H30S')).toBe(7230)
  })

  test('handles a zero-length duration', () => {
    expect(parseDuration('PT0S')).toBe(0)
  })

  test('handles multi-digit values', () => {
    expect(parseDuration('PT12H34M56S')).toBe(45296)
  })

  test('returns 0 for a malformed string', () => {
    expect(parseDuration('garbage')).toBe(0)
  })

  test('returns 0 for an empty string', () => {
    expect(parseDuration('')).toBe(0)
  })
})
