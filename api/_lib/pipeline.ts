// Relative, not the @/ alias — Vercel's function bundler doesn't resolve it.
import type { Analysis } from '../../src/schemas/analysis.js'
import type { AnalysisFailure } from '../../src/lib/view-state.js'
import { extractResumeText, NoTextFoundError, UnreadableFileError } from './extract.js'
import { analyzeResumeText, AiUnavailableError, RateLimitedError } from './gemini.js'
import { looksLikeResume } from './resume-heuristic.js'

/** Server-side ceiling. The client enforces the same, but the server must not
 * trust it — this is the real boundary. Kept under Vercel's ~4.5MB request-body
 * limit so oversized uploads fail here with a clear message, not at the platform. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

/** Resumes run a few thousand characters; anything past this is noise (or an
 * attempt to run up token cost), so it's truncated before reaching the model. */
const MAX_RESUME_CHARS = 20_000

/** A job description's real requirements sit well within this; the cap bounds
 * both header size and the tokens the JD adds to the prompt. */
export const MAX_JOB_DESCRIPTION_CHARS = 6_000

/** The upload doesn't read like a resume. Carries the reason so the UI can show
 * the user why and offer to analyze anyway. Not an error the user must fix — a
 * warning they can override. */
export class NotAResumeError extends Error {
  constructor(readonly reason: string) {
    super(reason)
    this.name = 'NotAResumeError'
  }
}

/**
 * Extract text, sanity-check that it's actually a resume, then analyze it.
 *
 * The resume check runs before the model call so a non-resume is caught in
 * under a millisecond rather than after a ~20s round trip. `force` skips it —
 * that's the "analyze anyway" path when the heuristic flagged a real resume.
 */
export async function runAnalysis(
  bytes: Uint8Array,
  filename: string,
  options: { force?: boolean; jobDescription?: string | undefined } = {},
): Promise<Analysis> {
  const text = (await extractResumeText(bytes, filename)).slice(0, MAX_RESUME_CHARS)

  if (!options.force) {
    const verdict = looksLikeResume(text)
    if (!verdict.isResume) throw new NotAResumeError(verdict.reason)
  }

  // The resume check only ever runs against the resume — a JD is optional
  // context for the comparison, never itself the document under review.
  const jobDescription = options.jobDescription?.trim().slice(0, MAX_JOB_DESCRIPTION_CHARS)
  return analyzeResumeText(text, jobDescription || undefined)
}

/**
 * Collapse any pipeline error into one of the failure codes the UI has a screen
 * for. Both extraction failures map to `noTextFound`: whether a file is a scan
 * or corrupt, the user's next move is the same — supply a proper text document —
 * and that screen already says how.
 */
export function toAnalysisFailure(error: unknown): AnalysisFailure {
  if (error instanceof NoTextFoundError || error instanceof UnreadableFileError) {
    return 'noTextFound'
  }
  if (error instanceof RateLimitedError) return 'rateLimited'
  if (error instanceof AiUnavailableError) return 'aiUnavailable'
  return 'unknown'
}

export function statusForFailure(failure: AnalysisFailure): number {
  switch (failure) {
    case 'noTextFound':
      return 422 // the file was understood but can't be analyzed
    case 'rateLimited':
      return 429
    case 'aiUnavailable':
      return 502 // an upstream (the AI) failed
    case 'unknown':
      return 500
  }
}
