import type { ViewState } from '@/lib/view-state'
import { mockAnalysis, mockPerfectAnalysis } from '@/mocks/analysis'

/**
 * TEMPORARY — delete once /api/analyze is real.
 *
 * Jumps straight to any screen so all six are reviewable without a backend.
 * Quarantined in src/dev/ so removing it is deleting one folder and one import.
 */
const PRESETS: { label: string; state: ViewState }[] = [
  { label: 'Upload', state: { status: 'idle' } },
  { label: 'Analyzing', state: { status: 'analyzing', file: fakeFile() } },
  { label: 'Results', state: { status: 'results', analysis: mockAnalysis } },
  { label: 'Results (empty states)', state: { status: 'results', analysis: mockPerfectAnalysis } },
  { label: 'No text', state: { status: 'failed', failure: 'noTextFound', file: fakeFile() } },
  { label: 'Rate limited', state: { status: 'failed', failure: 'rateLimited', file: fakeFile() } },
  { label: 'AI down', state: { status: 'failed', failure: 'aiUnavailable', file: fakeFile() } },
]

function fakeFile(): File {
  return new File(['stub'], 'Sarah_Chen_Resume_2024.pdf', { type: 'application/pdf' })
}

export function PreviewBar({ onSelect }: { onSelect: (state: ViewState) => void }) {
  return (
    <div className="border-b border-dashed border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-2">
        <span className="font-display text-[10px] tracking-[0.08em] text-on-surface-variant uppercase">
          Dev preview
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.state)}
            className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs transition-colors hover:bg-surface-container"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
