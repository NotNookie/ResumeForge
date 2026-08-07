import type { MissingKeyword } from '@/schemas/analysis'

/**
 * High-priority gaps carry the error tint; medium-priority ones stay neutral.
 * Static class strings — Tailwind can't see names built by concatenation.
 */
const PRIORITY_STYLES: Record<MissingKeyword['priority'], string> = {
  high: 'bg-error-container text-on-error-container font-semibold',
  medium: 'bg-surface-container-high text-on-surface-variant',
}

export function PriorityChips({ items }: { items: readonly MissingKeyword[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ keyword, priority }) => (
        <li
          key={keyword}
          className={`rounded px-2.5 py-1 text-xs ${PRIORITY_STYLES[priority]}`}
          title={priority === 'high' ? 'Core to this role' : 'Nice to have'}
        >
          {keyword}
        </li>
      ))}
    </ul>
  )
}
