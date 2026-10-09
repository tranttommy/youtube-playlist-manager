// packages/web/src/lib/request.test.ts
import { describe, expect, test } from 'bun:test'
import { parseSSEChunk } from './request'

describe('parseSSEChunk', () => {
  test('parses a progress event', () => {
    const chunk = 'event: progress\ndata: {"processed":5,"total":10}'
    expect(parseSSEChunk(chunk)).toEqual({
      event: 'progress',
      data: { processed: 5, total: 10 }
    })
  })

  test('parses a done event', () => {
    const chunk = 'event: done\ndata: {"succeeded":3,"failed":0}'
    expect(parseSSEChunk(chunk)).toEqual({
      event: 'done',
      data: { succeeded: 3, failed: 0 }
    })
  })

  test('returns null for a chunk with no data', () => {
    expect(parseSSEChunk('event: progress')).toBeNull()
  })
})
