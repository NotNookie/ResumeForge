import type { Analysis } from '@/schemas/analysis'

/**
 * Realistic analysis for building and reviewing the UI before the AI exists.
 * Deliberately mid-range (an amber overall, a strong ATS, a weak recruiter) so
 * all three score bands render on one screen.
 *
 * Kept honest to the schema: a test parses this to catch drift.
 */
export const mockAnalysis: Analysis = {
  candidate: {
    name: 'Sarah Chen',
    targetRole: 'Product Manager',
  },
  scores: {
    overall: 72,
    ats: 85,
    recruiter: 54,
  },
  summary:
    'Your resume is structurally sound but lacks specific achievement metrics in the experience section. Focus on quantifying your impact.',
  strengths: [
    {
      title: 'Strong action verbs',
      detail: "Good use of 'Led', 'Developed', and 'Managed' to open bullet points.",
    },
    {
      title: 'Clear contact info',
      detail: 'Header is cleanly formatted and parses correctly for ATS.',
    },
    {
      title: 'Appropriate length',
      detail: 'Sticking to a single page is ideal for your experience level.',
    },
  ],
  criticalFixes: [
    {
      title: 'Vague job descriptions',
      detail:
        'Your bullet points describe responsibilities rather than achievements, which reads as a job description rather than a record of impact.',
      fix: 'Use the STAR method and include specific numbers.',
    },
    {
      title: 'Inconsistent date formatting',
      detail: 'ATS systems struggle with mixed date formats and may misparse your timeline.',
      fix: "Standardize all dates to 'Month Year' format.",
    },
  ],
  missingKeywords: [
    { keyword: 'SQL', priority: 'high' },
    { keyword: 'Project Management', priority: 'high' },
    { keyword: 'Agile', priority: 'high' },
    { keyword: 'Data Analysis', priority: 'high' },
    { keyword: 'AWS', priority: 'medium' },
    { keyword: 'Python', priority: 'medium' },
  ],
  formattingIssues: [
    'Margins are slightly too narrow. Increase to at least 0.75".',
    'Font size for body text is 10pt. Consider bumping to 11pt.',
    'Inconsistent spacing between sections. Ensure uniform padding.',
  ],
}

/**
 * The happy path: everything empty or excellent. Empty arrays are a real state —
 * a great resume has no critical fixes — and they must not render as broken
 * boxes.
 */
export const mockPerfectAnalysis: Analysis = {
  candidate: { name: null, targetRole: null },
  scores: { overall: 94, ats: 96, recruiter: 91 },
  summary: 'This resume is well structured, specific, and quantified throughout.',
  strengths: [
    {
      title: 'Quantified achievements',
      detail: 'Nearly every bullet carries a concrete metric.',
    },
  ],
  criticalFixes: [],
  missingKeywords: [],
  formattingIssues: [],
}
