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

      {/* No icons. The mock varied them per issue, but the schema has no category
          to vary them by, and one icon repeated three times is decoration that
          reads as noise. A rule per row carries the separation instead. */}
      <ul className="mt-4 divide-y divide-outline-variant/50 border-t border-outline-variant/50">
        {issues.map((issue) => (
          <li key={issue} className="py-3 text-sm leading-relaxed text-on-surface-variant">
            {issue}
          </li>
        ))}
      </ul>
    </section>
  )
}
