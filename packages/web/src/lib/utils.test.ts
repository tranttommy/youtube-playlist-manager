import { describe, expect, test } from 'bun:test'
import { formatDuration } from './utils'

describe('formatDuration', () => {
  test('formats minutes and seconds', () => {
    expect(formatDuration(253)).toBe('4:13')
  })

  test('pads seconds under ten', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  test('shows 0 minutes for sub-minute durations', () => {
    expect(formatDuration(45)).toBe('0:45')
  })

  test('formats hours, padding minutes and seconds', () => {
    expect(formatDuration(3723)).toBe('1:02:03')
  })

  test('formats exactly one hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
  })

  test('does not pad the leading unit', () => {
    expect(formatDuration(45296)).toBe('12:34:56')
  })

  test('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
})
