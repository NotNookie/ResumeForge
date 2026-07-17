import { z } from 'zod'
import { clampScore } from '@/lib/scoring'

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
  criticalFixes: z
    .array(finding.extend({ fix: z.string().trim().min(1).max(400) }))
    .max(6),

  /** priority drives chip weight in the UI: high reads as a gap, medium as a nice-to-have. */
  missingKeywords: z
    .array(
      z.object({
        keyword: z.string().trim().min(1).max(40),
        priority: z.enum(['high', 'medium']),
      }),
    )
    .max(15),

  formattingIssues: z.array(z.string().trim().min(1).max(300)).max(6),
})

export type Analysis = z.infer<typeof analysisSchema>
export type Finding = Analysis['strengths'][number]
export type CriticalFix = Analysis['criticalFixes'][number]
export type MissingKeyword = Analysis['missingKeywords'][number]
