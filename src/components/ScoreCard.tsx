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
  /** The headline score gets the largest numeral; the two supporting ones sit a step down. */
  emphasis?: 'primary' | 'secondary'
}

export function ScoreCard({ label, score, emphasis = 'secondary' }: ScoreCardProps) {
  const band = scoreBand(score)
  const styles = BAND_STYLES[band]
  const isPrimary = emphasis === 'primary'

  return (
    <div
      className={`flex flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-card ${
        isPrimary ? 'p-8' : 'p-7'
      }`}
    >
      <p className="font-display text-[11px] font-semibold tracking-[0.1em] text-on-surface-variant uppercase">
        {label}
      </p>

      <div className="mt-auto flex items-baseline gap-2 pt-10">
        <span
          className={`font-display font-semibold tabular-nums tracking-tight ${styles.text} ${
            isPrimary ? 'text-8xl' : 'text-7xl'
          }`}
        >
          {score}
        </span>
        <span className="font-display text-xl font-medium text-outline-variant">/100</span>
      </div>

      <p className={`mt-3 font-display text-sm font-semibold ${styles.text}`}>
        {SCORE_BAND_LABEL[band]}
      </p>

      {/* Bar repeats the score visually; the numeral above is the accessible value. */}
      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-surface-container-high"
        role="img"
        aria-label={`${score} out of 100 — ${SCORE_BAND_LABEL[band]}`}
      >
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
