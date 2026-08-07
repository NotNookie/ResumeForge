import { Briefcase, Lightbulb } from 'lucide-react'
import type { JobMatch } from '@/schemas/analysis'
import { scoreBand, type ScoreBand } from '@/lib/scoring'
import { PriorityChips } from '@/components/PriorityChips'

/** Band → colour for the match ring. Static strings for Tailwind's scanner. */
const BAND_TEXT: Record<ScoreBand, string> = {
  strong: 'text-secondary',
  fair: 'text-warning',
  weak: 'text-error',
}

const BAND_RING: Record<ScoreBand, string> = {
  strong: 'border-secondary',
  fair: 'border-warning',
  weak: 'border-error',
}

/**
 * The job-description comparison, shown above the general analysis when the user
 * pasted a JD. Distinct from the resume scores: this answers "how well do I fit
 * THIS role, and what would make me fit better?"
 */
export function JobMatchSection({ jobMatch }: { jobMatch: JobMatch }) {
  const band = scoreBand(jobMatch.matchScore)

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-8 shadow-card">
      <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
        <Briefcase className="size-4" aria-hidden="true" />
        Job match
      </p>

      <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <div
          className={`flex size-32 shrink-0 flex-col items-center justify-center rounded-full border-4 ${BAND_RING[band]}`}
          role="img"
          aria-label={`${jobMatch.matchScore} out of 100 match`}
        >
          <span className={`font-display text-4xl font-semibold tabular-nums ${BAND_TEXT[band]}`}>
            {jobMatch.matchScore}
          </span>
          <span className="font-display text-[11px] font-medium tracking-[0.08em] text-on-surface-variant uppercase">
            Match
          </span>
        </div>

        <p className="text-lg leading-relaxed text-pretty text-on-surface-variant">
          {jobMatch.summary}
        </p>
      </div>

      {jobMatch.missingRequirements.length > 0 ? (
        <div className="mt-8 border-t border-outline-variant/60 pt-6">
          <h3 className="font-display text-sm font-semibold">Requirements you're not showing</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Named in the posting but not evidenced in your resume.
          </p>
          <div className="mt-4">
            <PriorityChips items={jobMatch.missingRequirements} />
          </div>
        </div>
      ) : null}

      {jobMatch.tailoredFixes.length > 0 ? (
        <div className="mt-8 border-t border-outline-variant/60 pt-6">
          <h3 className="font-display text-sm font-semibold">Tailor it to this role</h3>
          <ul className="mt-4 space-y-5">
            {jobMatch.tailoredFixes.map((fix) => (
              <li key={fix.title} className="flex gap-3">
                <Lightbulb
                  className="mt-0.5 size-4 shrink-0 text-secondary"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-display text-sm font-semibold">{fix.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                    {fix.detail} <span className="font-medium text-on-surface">{fix.fix}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
