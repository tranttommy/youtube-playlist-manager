import { describe, expect, test } from 'bun:test'

const add = (a: number, b: number) => a + b

describe('Add', () => {
  test('7 + 8', () => {
    expect(add(7, 8)).toBe(15)
  })

  test('1 + 5', () => {
    expect(add(1, 5)).toBe(6)
  })
})
