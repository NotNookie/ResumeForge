import type { MissingKeyword } from '@/schemas/analysis'
import { PriorityChips } from '@/components/PriorityChips'

type MissingKeywordsProps = {
  keywords: readonly MissingKeyword[]
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
      <div className="mt-4">
        <PriorityChips items={keywords} />
      </div>
    </section>
  )
}
