import { describe, expect, it } from 'vitest'
import { clampScore, scoreBand } from '@/lib/scoring'

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

describe('scoreBand', () => {
  it('bands scores at the documented boundaries', () => {
    expect(scoreBand(100)).toBe('strong')
    expect(scoreBand(80)).toBe('strong')
    expect(scoreBand(79)).toBe('fair')
    expect(scoreBand(60)).toBe('fair')
    expect(scoreBand(59)).toBe('weak')
    expect(scoreBand(0)).toBe('weak')
  })

  it('bands on the rounded value, so 79.5 reads as strong', () => {
    expect(scoreBand(79.5)).toBe('strong')
  })

  it('bands out-of-range scores by their clamped value', () => {
    expect(scoreBand(140)).toBe('strong')
    expect(scoreBand(Number.NaN)).toBe('weak')
  })
})
