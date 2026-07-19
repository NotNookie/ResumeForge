import { RotateCw } from 'lucide-react'
import type { Analysis } from '@/schemas/analysis'
import { scoreBand } from '@/lib/scoring'
import { verdictHeadline } from '@/lib/verdict'
import { ScoreCard } from '@/components/ScoreCard'
import { CriticalFixes } from '@/components/CriticalFixes'
import { Strengths } from '@/components/Strengths'
import { MissingKeywords } from '@/components/MissingKeywords'
import { FormattingIssues } from '@/components/FormattingIssues'

type ResultsViewProps = {
  analysis: Analysis
  onReset: () => void
}

export function ResultsView({ analysis, onReset }: ResultsViewProps) {
  const { candidate, scores, summary, strengths, criticalFixes } = analysis
  const headline = verdictHeadline(scoreBand(scores.overall), candidate.name)

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        {/* Editorial label + rule, borrowed from the report mock. Both halves are
            nullable, so each degrades independently. */}
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
            Analysis report
            {candidate.targetRole ? ` // ${candidate.targetRole}` : null}
          </p>
          {candidate.name ? (
            <p className="hidden font-display text-xs font-medium tracking-[0.04em] text-on-surface-variant sm:block">
              {candidate.name}
            </p>
          ) : null}
        </div>

        <div className="mt-3 border-t-2 border-on-surface" />

        <h1 className="mt-8 max-w-4xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {headline}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-on-surface-variant">
          {summary}
        </p>
      </header>

      {/* Overall leads with more room and the largest numeral; the two supporting
          scores sit a step down beside it. */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <ScoreCard label="Overall score" score={scores.overall} emphasis="primary" />
        <ScoreCard label="ATS compatibility" score={scores.ats} />
        <ScoreCard label="Recruiter appeal" score={scores.recruiter} />
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <CriticalFixes fixes={criticalFixes} />
          <Strengths strengths={strengths} />
        </div>

        {/* Sticky so the shorter column tracks the longer one instead of
            stranding the reset button halfway up an empty gutter. */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="space-y-8 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-8">
            <MissingKeywords keywords={analysis.missingKeywords} />
            <div className="border-t border-outline-variant/60" />
            <FormattingIssues issues={analysis.formattingIssues} />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3.5 font-display text-sm font-medium transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Analyze another resume
          </button>
        </aside>
      </div>
    </main>
  )
}
