import type { ViewState } from '@/lib/view-state'
import { PRESETS } from '@/dev/presets'

/**
 * TEMPORARY — delete once /api/analyze is real. Quarantined in src/dev/ so
 * removing it is deleting one folder and one import.
 */
export function PreviewBar({ onSelect }: { onSelect: (state: ViewState) => void }) {
  return (
    <div className="border-b border-dashed border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-2">
        <span className="font-display text-[10px] tracking-[0.08em] text-on-surface-variant uppercase">
          Dev preview
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              // Keep the URL in step so a screen can be reloaded or shared.
              window.history.replaceState(null, '', `?preview=${preset.id}`)
              onSelect(preset.state)
            }}
            className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs transition-colors hover:bg-surface-container"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
