import { Ruler } from 'lucide-react'

type FormattingIssuesProps = {
  issues: readonly string[]
}

export function FormattingIssues({ issues }: FormattingIssuesProps) {
  if (issues.length === 0) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold">Formatting</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Clean. Margins, type size, and spacing all parse well.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Formatting</h2>

      <ul className="mt-4 space-y-4">
        {issues.map((issue) => (
          <li key={issue} className="flex gap-3">
            <Ruler className="mt-0.5 size-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-on-surface-variant">{issue}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
