import { z } from 'zod'
// Relative, not @/: this module is imported by the api/ serverless functions,
// whose Vercel bundler doesn't resolve the alias.
import { clampScore } from '../lib/scoring'

/**
 * The contract with the AI. This is the single source of truth for the shape of
 * an analysis: the prompt is written to satisfy it, and the UI renders z.infer
 * of it. Change this file and both sides follow.
 */

/**
 * Scores arrive as plain numbers and are occasionally out of range. Clamp rather
 * than reject — one silly number shouldn't discard an otherwise good analysis.
 */
const score = z.number().transform(clampScore)

/** A titled observation: a short label plus a sentence or two of explanation. */
const finding = z.object({
  title: z.string().trim().min(1).max(80),
  detail: z.string().trim().min(1).max(400),
})

/** A finding that also carries a concrete correction. */
const fixable = finding.extend({ fix: z.string().trim().min(1).max(400) })

/** A term the resume is missing; priority drives chip weight in the UI. */
const priorityKeyword = z.object({
  keyword: z.string().trim().min(1).max(40),
  priority: z.enum(['high', 'medium']),
})

/**
 * Present only when the user pasted a job description. The match score compares
 * two real documents (resume vs JD), so unlike a candidate percentile it's a
 * defensible estimate. Nullable + defaulted: resume-only analyses omit it.
 */
const jobMatch = z.object({
  matchScore: score,
  summary: z.string().trim().min(1).max(400),
  /** Requirements named in the JD that the resume doesn't evidence. */
  missingRequirements: z.array(priorityKeyword).max(15),
  /** How to rewrite the resume to fit this specific role. */
  tailoredFixes: z.array(fixable).max(6),
})

export const analysisSchema = z.object({
  /**
   * Extracted from the resume, so both are nullable: plenty of resumes state no
   * target role, and name extraction fails on unusual layouts. The UI must have
   * a real fallback for null — never interpolate these blind.
   */
  candidate: z.object({
    name: z.string().trim().min(1).max(100).nullable(),
    targetRole: z.string().trim().min(1).max(100).nullable(),
  }),

  scores: z.object({
    overall: score,
    ats: score,
    recruiter: score,
  }),

  /** One or two sentences under the headline. The verdict in prose. */
  summary: z.string().trim().min(1).max(400),

  /** Can be empty — a weak resume may have nothing worth praising. */
  strengths: z.array(finding).max(6),

  /** Can be empty — a strong resume may have nothing critical to fix. */
  criticalFixes: z.array(fixable).max(6),

  missingKeywords: z.array(priorityKeyword).max(15),

  formattingIssues: z.array(z.string().trim().min(1).max(300)).max(6),

  /**
   * The job-description comparison, or null for a resume-only analysis. Defaulted
   * so the model omitting the key (the common, no-JD case) parses cleanly.
   */
  jobMatch: jobMatch.nullable().default(null),
})

export type Analysis = z.infer<typeof analysisSchema>
export type Finding = Analysis['strengths'][number]
export type CriticalFix = Analysis['criticalFixes'][number]
export type MissingKeyword = Analysis['missingKeywords'][number]
export type JobMatch = NonNullable<Analysis['jobMatch']>
