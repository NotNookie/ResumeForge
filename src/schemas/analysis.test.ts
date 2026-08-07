import { describe, expect, it } from 'vitest'
import { analysisSchema } from '@/schemas/analysis'

/** A minimal valid analysis; each test overrides only what it's exercising. */
function validAnalysis() {
  return {
    candidate: { name: 'Alex Rivera', targetRole: 'Product Designer' },
    scores: { overall: 72, ats: 85, recruiter: 64 },
    summary: 'Structurally sound but lacks achievement metrics.',
    strengths: [{ title: 'Strong action verbs', detail: "Good use of 'Led'." }],
    criticalFixes: [
      {
        title: 'Vague job descriptions',
        detail: 'Bullets describe responsibilities, not achievements.',
        fix: 'Use the STAR method and include specific numbers.',
      },
    ],
    missingKeywords: [{ keyword: 'SQL', priority: 'high' as const }],
    formattingIssues: ['Margins are too narrow.'],
  }
}

describe('analysisSchema', () => {
  it('accepts a well-formed analysis', () => {
    expect(analysisSchema.safeParse(validAnalysis()).success).toBe(true)
  })

  it('defaults jobMatch to null when the resume-only response omits it', () => {
    const result = analysisSchema.parse(validAnalysis())
    expect(result.jobMatch).toBeNull()
  })

  it('accepts a populated jobMatch and clamps its score', () => {
    const result = analysisSchema.parse({
      ...validAnalysis(),
      jobMatch: {
        matchScore: 130,
        summary: 'Strong fit, missing a couple of required tools.',
        missingRequirements: [{ keyword: 'Kubernetes', priority: 'high' as const }],
        tailoredFixes: [
          { title: 'Surface cloud work', detail: 'The JD centers on AWS.', fix: 'Add an AWS bullet.' },
        ],
      },
    })
    expect(result.jobMatch?.matchScore).toBe(100)
    expect(result.jobMatch?.missingRequirements[0]?.keyword).toBe('Kubernetes')
  })

  it('rejects a jobMatch missing its score', () => {
    const { matchScore: _omit, ...noScore } = {
      matchScore: 70,
      summary: 'ok',
      missingRequirements: [],
      tailoredFixes: [],
    }
    const result = analysisSchema.safeParse({ ...validAnalysis(), jobMatch: noScore })
    expect(result.success).toBe(false)
  })

  it('clamps out-of-range scores instead of rejecting the whole analysis', () => {
    const result = analysisSchema.parse({
      ...validAnalysis(),
      scores: { overall: 140, ats: -10, recruiter: 81.6 },
    })
    expect(result.scores).toEqual({ overall: 100, ats: 0, recruiter: 82 })
  })

  it('accepts empty arrays — a strong resume has no critical fixes', () => {
    const result = analysisSchema.parse({
      ...validAnalysis(),
      strengths: [],
      criticalFixes: [],
      missingKeywords: [],
      formattingIssues: [],
    })
    expect(result.criticalFixes).toEqual([])
  })

  it('accepts a null name and role — extraction fails on unusual resumes', () => {
    const result = analysisSchema.parse({
      ...validAnalysis(),
      candidate: { name: null, targetRole: null },
    })
    expect(result.candidate.name).toBeNull()
  })

  it('rejects a score returned as a string', () => {
    const result = analysisSchema.safeParse({
      ...validAnalysis(),
      scores: { overall: '72', ats: 85, recruiter: 64 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown keyword priority', () => {
    const result = analysisSchema.safeParse({
      ...validAnalysis(),
      missingKeywords: [{ keyword: 'SQL', priority: 'urgent' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing section rather than rendering a half-empty report', () => {
    const { strengths: _omitted, ...withoutStrengths } = validAnalysis()
    expect(analysisSchema.safeParse(withoutStrengths).success).toBe(false)
  })

  it('trims whitespace the model pads around strings', () => {
    const result = analysisSchema.parse({
      ...validAnalysis(),
      summary: '  Padded summary.  ',
    })
    expect(result.summary).toBe('Padded summary.')
  })

  it('rejects an empty-string title that would render as a blank card', () => {
    const result = analysisSchema.safeParse({
      ...validAnalysis(),
      strengths: [{ title: '   ', detail: 'Detail text.' }],
    })
    expect(result.success).toBe(false)
  })
})
