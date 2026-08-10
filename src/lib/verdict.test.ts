import { describe, expect, it } from 'vitest'
import { displayName, verdictHeadline } from '@/lib/verdict'

describe('verdictHeadline', () => {
  it('greets by first name only', () => {
    expect(verdictHeadline('fair', 'Sarah Chen')).toBe('Almost there, Sarah.')
  })

  it('title-cases an all-caps name in the headline', () => {
    expect(verdictHeadline('weak', 'ALEX PARK')).toBe('Some work to do, Alex.')
  })

  it('varies the verdict by band', () => {
    expect(verdictHeadline('strong', 'Sarah Chen')).toBe('Strong work, Sarah.')
    expect(verdictHeadline('weak', 'Sarah Chen')).toBe('Some work to do, Sarah.')
  })

  it('falls back to a nameless sentence when extraction found no name', () => {
    expect(verdictHeadline('fair', null)).toBe('Almost there.')
    expect(verdictHeadline('strong', null)).toBe('This is a strong resume.')
  })

  it('treats a whitespace-only name as no name', () => {
    expect(verdictHeadline('fair', '   ')).toBe('Almost there.')
  })

  it('handles a mononym', () => {
    expect(verdictHeadline('fair', 'Prince')).toBe('Almost there, Prince.')
  })

  it('handles a name padded or multi-spaced by the model', () => {
    expect(verdictHeadline('fair', '  Sarah   Chen  ')).toBe('Almost there, Sarah.')
  })
})

describe('displayName', () => {
  it('title-cases a shouting all-caps name', () => {
    expect(displayName('ALEX PARK')).toBe('Alex Park')
  })

  it('leaves an already mixed-case name untouched', () => {
    expect(displayName('Alex Park')).toBe('Alex Park')
    expect(displayName('Sarah McDonald')).toBe('Sarah McDonald')
    expect(displayName('DeShawn Carter')).toBe('DeShawn Carter')
  })

  it('title-cases across hyphens and apostrophes', () => {
    expect(displayName("MARY-JANE O'BRIEN")).toBe("Mary-Jane O'Brien")
  })
})
