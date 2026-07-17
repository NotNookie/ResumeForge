import type { Analysis } from '@/schemas/analysis'

/**
 * The whole app is one linear flow, so its screens are states rather than
 * routes. Nothing is persisted — a /results URL would break on refresh and on
 * share, promising a permanence the app doesn't have.
 *
 * A discriminated union rather than booleans: `analyzing` cannot coexist with
 * `results`, and the compiler enforces that instead of a code review catching it.
 */
export type ViewState =
  | { status: 'idle' }
  | { status: 'fileSelected'; file: File }
  | { status: 'analyzing'; file: File }
  | { status: 'results'; analysis: Analysis }
  // Carries the file so a retry can actually re-run it. Without this, "Retry"
  // silently means "start over", and the rate-limit copy promising the file is
  // still here would be a lie.
  | { status: 'failed'; failure: AnalysisFailure; file: File }

/**
 * Failures that end the flow and warrant their own screen. Anything the user can
 * fix in place — wrong file type, too large — is handled inline on the upload
 * screen instead, where their next action already is.
 */
export type AnalysisFailure = 'noTextFound' | 'rateLimited' | 'aiUnavailable' | 'unknown'

type FailureCopy = {
  title: string
  detail: string
  /** Null when there's nothing useful to add beyond the detail. */
  guidance: string | null
  retryLabel: string
  /**
   * Whether re-running the same file could plausibly succeed. A scanned PDF will
   * never grow a text layer, so that failure sends the user back to pick a
   * different file rather than offering a retry that cannot work.
   */
  canRetrySameFile: boolean
}

export const FAILURE_COPY: Record<AnalysisFailure, FailureCopy> = {
  noTextFound: {
    title: 'No text detected',
    detail: 'This file looks like a scanned image. We need a text layer to read your resume.',
    guidance:
      'Export your resume as a PDF from Word, Google Docs, or Canva rather than scanning or photographing a printed copy.',
    retryLabel: 'Choose another file',
    canRetrySameFile: false,
  },
  rateLimited: {
    title: "We're a bit overloaded",
    detail: 'ResumeForge is handling more resumes than usual right now.',
    guidance: 'Wait a moment and try again — your file is still here.',
    retryLabel: 'Retry analysis',
    canRetrySameFile: true,
  },
  aiUnavailable: {
    title: "Analysis didn't complete",
    detail: 'Something went wrong while reading your resume. This one is on us, not on your file.',
    guidance: null,
    retryLabel: 'Retry analysis',
    canRetrySameFile: true,
  },
  unknown: {
    title: 'Something went wrong',
    detail: "We couldn't finish analyzing your resume.",
    guidance: null,
    retryLabel: 'Try again',
    canRetrySameFile: true,
  },
}
