import { SCORE_BAND_LABEL, scoreBand, type ScoreBand } from '@/lib/scoring'

/**
 * Band → colour. Static full class strings, because Tailwind scans source text
 * and cannot see classes built by concatenation.
 */
const BAND_STYLES: Record<ScoreBand, { text: string; bar: string }> = {
  strong: { text: 'text-secondary', bar: 'bg-secondary' },
  fair: { text: 'text-warning', bar: 'bg-warning' },
  weak: { text: 'text-error', bar: 'bg-error' },
}

type ScoreCardProps = {
  label: string
  score: number
}

export function ScoreCard({ label, score }: ScoreCardProps) {
  const band = scoreBand(score)
  const styles = BAND_STYLES[band]

  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center">
      <p className="font-display text-xs font-semibold tracking-[0.08em] text-on-surface-variant uppercase">
        {label}
      </p>

      <p className={`mt-3 font-display text-6xl font-semibold tabular-nums ${styles.text}`}>
        {score}
      </p>

      <p className={`mt-2 font-display text-sm font-medium ${styles.text}`}>
        {SCORE_BAND_LABEL[band]}
      </p>

      {/* Bar repeats the score visually; the number above is the accessible value. */}
      <div
        className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-container-high"
        role="img"
        aria-label={`${score} out of 100 — ${SCORE_BAND_LABEL[band]}`}
      >
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
