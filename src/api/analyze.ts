import type { Analysis } from '@/schemas/analysis'
import type { AnalysisFailure } from '@/lib/view-state'
import { mockAnalysis } from '@/mocks/analysis'

/**
 * Thrown for failures the UI has a dedicated screen for. Anything else surfaces
 * as `unknown` rather than leaking a raw fetch error into the interface.
 */
export class AnalysisError extends Error {
  constructor(readonly failure: AnalysisFailure) {
    super(failure)
    this.name = 'AnalysisError'
  }
}

/**
 * STUB — /api/analyze does not exist yet.
 *
 * The signature is the real one, so wiring the backend means replacing this
 * body and nothing else. Until then it returns the mock after a delay that
 * roughly matches a real analysis, which is what makes the loading screen
 * reviewable.
 */
export async function analyzeResume(_file: File): Promise<Analysis> {
  await new Promise((resolve) => setTimeout(resolve, 9_000))
  return mockAnalysis
}
