import type { MissingKeyword } from '@/schemas/analysis'

type MissingKeywordsProps = {
  keywords: readonly MissingKeyword[]
}

/**
 * High-priority gaps carry the error tint; medium-priority ones stay neutral.
 * Static class strings — Tailwind can't see concatenated names.
 */
const PRIORITY_STYLES: Record<MissingKeyword['priority'], string> = {
  high: 'bg-error-container text-on-error-container font-semibold',
  medium: 'bg-surface-container-high text-on-surface-variant',
}

export function MissingKeywords({ keywords }: MissingKeywordsProps) {
  if (keywords.length === 0) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold">Keywords</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          No obvious keyword gaps. Your resume covers the terms expected for this role.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Missing keywords</h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        Consider weaving these into your experience section.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {keywords.map(({ keyword, priority }) => (
          <li
            key={keyword}
            className={`rounded px-2.5 py-1 text-xs ${PRIORITY_STYLES[priority]}`}
            title={priority === 'high' ? 'Frequently expected for this role' : 'Nice to have'}
          >
            {keyword}
          </li>
        ))}
      </ul>
    </section>
  )
}
