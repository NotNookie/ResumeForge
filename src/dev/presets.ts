import type { ViewState } from '@/lib/view-state'
import { mockAnalysis, mockPerfectAnalysis } from '@/mocks/analysis'

/**
 * TEMPORARY — delete alongside PreviewBar once /api/analyze is real.
 *
 * Presets are addressable by `?preview=<id>` so each screen can be opened
 * directly, which is what makes them screenshottable and reviewable without
 * clicking through the flow.
 */
export type Preset = {
  id: string
  label: string
  state: ViewState
}

function stubFile(): File {
  return new File(['stub'], 'Sarah_Chen_Resume_2024.pdf', { type: 'application/pdf' })
}

export const PRESETS: Preset[] = [
  { id: 'upload', label: 'Upload', state: { status: 'idle' } },
  { id: 'selected', label: 'File selected', state: { status: 'fileSelected', file: stubFile() } },
  { id: 'analyzing', label: 'Analyzing', state: { status: 'analyzing', file: stubFile() } },
  { id: 'results', label: 'Results', state: { status: 'results', analysis: mockAnalysis } },
  {
    id: 'results-empty',
    label: 'Results (empty states)',
    state: { status: 'results', analysis: mockPerfectAnalysis },
  },
  {
    id: 'no-text',
    label: 'No text',
    state: { status: 'failed', failure: 'noTextFound', file: stubFile() },
  },
  {
    id: 'rate-limited',
    label: 'Rate limited',
    state: { status: 'failed', failure: 'rateLimited', file: stubFile() },
  },
  {
    id: 'ai-down',
    label: 'AI down',
    state: { status: 'failed', failure: 'aiUnavailable', file: stubFile() },
  },
]

/** The state named by ?preview=, or null when the param is absent or unknown. */
export function presetFromUrl(): ViewState | null {
  const id = new URLSearchParams(window.location.search).get('preview')
  if (!id) return null
  return PRESETS.find((preset) => preset.id === id)?.state ?? null
}
