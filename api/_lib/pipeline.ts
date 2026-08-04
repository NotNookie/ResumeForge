import type { Analysis } from '@/schemas/analysis'
import type { AnalysisFailure } from '@/lib/view-state'
import { extractResumeText, NoTextFoundError, UnreadableFileError } from './extract'
import { analyzeResumeText, AiUnavailableError, RateLimitedError } from './gemini'

/** Server-side ceiling. The client enforces the same, but the server must not
 * trust it — this is the real boundary. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Resumes run a few thousand characters; anything past this is noise (or an
 * attempt to run up token cost), so it's truncated before reaching the model. */
const MAX_RESUME_CHARS = 20_000

/** Extract text, then analyze it. The one place the two halves meet. */
export async function runAnalysis(bytes: Uint8Array, filename: string): Promise<Analysis> {
  const text = await extractResumeText(bytes, filename)
  return analyzeResumeText(text.slice(0, MAX_RESUME_CHARS))
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
