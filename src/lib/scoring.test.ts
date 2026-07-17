import { describe, expect, it } from 'vitest'
import { clampScore } from '@/lib/scoring'

describe('clampScore', () => {
  it('passes through valid scores', () => {
    expect(clampScore(72)).toBe(72)
  })

  it('clamps out-of-range values to the 0-100 window', () => {
    expect(clampScore(140)).toBe(100)
    expect(clampScore(-20)).toBe(0)
  })

  it('rounds fractional scores', () => {
    expect(clampScore(81.6)).toBe(82)
  })

  it('degrades to 0 rather than NaN when the model returns garbage', () => {
    expect(clampScore(Number.NaN)).toBe(0)
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(100)
  })
})
