import { analysisSchema, type Analysis } from '@/schemas/analysis'
import type { AnalysisFailure } from '@/lib/view-state'

/**
 * Carries a failure the UI has a dedicated screen for. Anything unexpected
 * surfaces as `unknown` rather than leaking a raw error into the interface.
 */
export class AnalysisError extends Error {
  constructor(readonly failure: AnalysisFailure) {
    super(failure)
    this.name = 'AnalysisError'
  }
}

/** The upload didn't look like a resume. Carries the reason so the UI can show
 * it and offer to analyze anyway. Not a hard failure — an overridable warning. */
export class NotAResumeError extends Error {
  constructor(readonly reason: string) {
    super(reason)
    this.name = 'NotAResumeError'
  }
}

/**
 * POST the raw file to /api/analyze and return a validated Analysis.
 *
 * The response is validated against the schema again on the client — the server
 * already does, but this side owns what it renders, and a shape mismatch should
 * surface as a clean failure, not a crash mid-render.
 */
export async function analyzeResume(
  file: File,
  options: { force?: boolean } = {},
): Promise<Analysis> {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-filename': encodeURIComponent(file.name),
        // Skip the server's resume check — the "analyze anyway" path.
        ...(options.force ? { 'x-force-analyze': '1' } : {}),
      },
      body: file,
    })
  } catch {
    // Network error, offline, request blocked — never reached the server.
    throw new AnalysisError('aiUnavailable')
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    if (isNotResumeBody(body)) throw new NotAResumeError(body.reason)
    throw new AnalysisError(failureFrom(body))
  }

  const parsed = analysisSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new AnalysisError('aiUnavailable')
  return parsed.data
}

function isNotResumeBody(body: unknown): body is { notResume: true; reason: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { notResume?: unknown }).notResume === true &&
    typeof (body as { reason?: unknown }).reason === 'string'
  )
}

/** Pull the failure code out of an error response, defaulting to unknown. */
function failureFrom(body: unknown): AnalysisFailure {
  const failure =
    typeof body === 'object' && body !== null ? (body as { failure?: unknown }).failure : undefined
  const known: AnalysisFailure[] = ['noTextFound', 'rateLimited', 'aiUnavailable', 'unknown']
  return known.includes(failure as AnalysisFailure) ? (failure as AnalysisFailure) : 'unknown'
}
