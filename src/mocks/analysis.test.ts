import { describe, expect, it } from 'vitest'
import { analysisSchema } from '@/schemas/analysis'
import { mockAnalysis, mockPerfectAnalysis } from '@/mocks/analysis'

/**
 * The mocks are what the UI is built and reviewed against. If they drift from
 * the schema, the design is being validated against a shape the AI will never
 * return.
 */
describe('mock analyses', () => {
  it('mockAnalysis satisfies the schema', () => {
    expect(analysisSchema.safeParse(mockAnalysis).success).toBe(true)
  })

  it('mockPerfectAnalysis satisfies the schema', () => {
    expect(analysisSchema.safeParse(mockPerfectAnalysis).success).toBe(true)
  })

  it('covers all three score bands, so the UI exercises every color', () => {
    const { overall, ats, recruiter } = mockAnalysis.scores
    expect(overall).toBeGreaterThanOrEqual(60)
    expect(overall).toBeLessThan(80)
    expect(ats).toBeGreaterThanOrEqual(80)
    expect(recruiter).toBeLessThan(60)
  })
})
