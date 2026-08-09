import { ArrowRight, CircleAlert } from 'lucide-react'
import type { CriticalFix } from '@/schemas/analysis'

type CriticalFixesProps = {
  fixes: readonly CriticalFix[]
}

export function CriticalFixes({ fixes }: CriticalFixesProps) {
  // A strong resume has nothing critical to fix. That's a result, not an empty
  // box — so the section resolves rather than disappearing.
  if (fixes.length === 0) {
    return (
      // Matches Strengths' tint exactly — the two sit adjacent when a resume is
      // clean, and mismatched opacities read as an accident.
      <section className="rounded-2xl bg-secondary-container/30 p-8">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-on-secondary-container">
          <CircleAlert className="size-5" aria-hidden="true" />
          No critical issues
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Nothing here is holding your resume back. Look at the suggestions below to sharpen it
          further.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-error-container/60 p-8">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-on-error-container">
        <CircleAlert className="size-5" aria-hidden="true" />
        Critical fixes
      </h2>

      <ul className="mt-6 space-y-6 border-t border-error/15 pt-6">
        {fixes.map((fix) => (
          <li key={fix.title}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="rounded-full bg-on-error-container px-2.5 py-1 font-display text-[10px] font-semibold tracking-[0.08em] text-on-error uppercase">
                Issue
              </span>
              <h3 className="font-display text-base font-semibold text-on-error-container">
                {fix.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{fix.detail}</p>

            {/* The fix is the actionable half, so it gets its own inset line
                rather than trailing the problem as run-on text. */}
            <div className="mt-3 flex gap-2.5 rounded-lg bg-surface-container-lowest p-3.5">
              <ArrowRight
                className="mt-0.5 size-4 shrink-0 text-on-error-container"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-on-surface">
                <span className="font-display font-semibold text-on-error-container">Fix </span>
                {fix.fix}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
