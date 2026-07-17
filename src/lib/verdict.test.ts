import { describe, expect, it } from 'vitest'
import { verdictHeadline } from '@/lib/verdict'

describe('verdictHeadline', () => {
  it('greets by first name only', () => {
    expect(verdictHeadline('fair', 'Sarah Chen')).toBe('Almost there, Sarah.')
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
