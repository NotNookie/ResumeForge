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

/**
 * POST the raw file to /api/analyze and return a validated Analysis.
 *
 * The response is validated against the schema again on the client — the server
 * already does, but this side owns what it renders, and a shape mismatch should
 * surface as a clean failure, not a crash mid-render.
 */
export async function analyzeResume(file: File): Promise<Analysis> {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-filename': encodeURIComponent(file.name),
      },
      body: file,
    })
  } catch {
    // Network error, offline, request blocked — never reached the server.
    throw new AnalysisError('aiUnavailable')
  }

  if (!response.ok) {
    throw new AnalysisError(await readFailure(response))
  }

  const parsed = analysisSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new AnalysisError('aiUnavailable')
  return parsed.data
}

/** Pull the failure code out of an error response, defaulting to unknown. */
async function readFailure(response: Response): Promise<AnalysisFailure> {
  const body: unknown = await response.json().catch(() => null)
  const failure =
    typeof body === 'object' && body !== null ? (body as { failure?: unknown }).failure : undefined

  const known: AnalysisFailure[] = ['noTextFound', 'rateLimited', 'aiUnavailable', 'unknown']
  return known.includes(failure as AnalysisFailure) ? (failure as AnalysisFailure) : 'unknown'
}
