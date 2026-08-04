import { describe, expect, it } from 'vitest'
import { analysisSchema } from '@/schemas/analysis'
import { analyzeResumeText } from './gemini'

/**
 * Hits the real Gemini API, so it's gated on the key and given a generous
 * timeout. This is the test that answers the only question that matters before
 * building the endpoint: does the model actually return our schema?
 */
const hasKey = Boolean(process.env.GEMINI_API_KEY)

const SAMPLE_RESUME = `SARAH CHEN
sarah.chen@email.com | (555) 012-3456 | San Francisco, CA

SUMMARY
Product Manager with 5 years of experience shipping B2B SaaS products.

EXPERIENCE
Product Manager, Acme Corp — 2021 to Present
- Responsible for the analytics dashboard product.
- Worked with engineering and design teams.
- Managed the product backlog and roadmap.

Associate Product Manager, Beta Inc — 2019 to 2021
- Helped launch a mobile app.
- Did user research and wrote specs.

EDUCATION
B.S. Computer Science, State University — 2019

SKILLS
Product strategy, roadmapping, user research, SQL, Figma`

describe.skipIf(!hasKey)('analyzeResumeText (live Gemini)', () => {
  it('returns a schema-valid analysis for a real resume', async () => {
    const analysis = await analyzeResumeText(SAMPLE_RESUME)

    // analyzeResumeText already validates, but assert again so a failure points
    // here rather than deep in the client.
    expect(analysisSchema.safeParse(analysis).success).toBe(true)

    expect(analysis.scores.overall).toBeGreaterThanOrEqual(0)
    expect(analysis.scores.overall).toBeLessThanOrEqual(100)
    expect(analysis.summary.length).toBeGreaterThan(0)

    // This resume names its owner, so extraction of the name should succeed.
    expect(analysis.candidate.name).toMatch(/sarah/i)
  }, 45_000)

  it('flags the vague, unquantified bullets as something to fix', async () => {
    const analysis = await analyzeResumeText(SAMPLE_RESUME)
    // The resume is deliberately weak on metrics; a competent reviewer should
    // surface at least one critical fix.
    expect(analysis.criticalFixes.length).toBeGreaterThan(0)
  }, 45_000)
})
