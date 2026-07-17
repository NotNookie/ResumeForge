/**
 * Scores from the AI arrive as unvalidated numbers. Clamp before display so a
 * model returning 0-1, 0-10, or an out-of-range value can never render a
 * nonsense progress bar.
 */
export function clampScore(value: number): number {
  // NaN carries no direction, so it can only collapse to 0. Infinities do carry
  // one and clamp to the correct end via the min/max below.
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export type ScoreBand = 'strong' | 'fair' | 'weak'

/**
 * Score → band. Most real resumes land in the 60s, so the amber band is wide on
 * purpose: a middling resume should read as "fixable", not "failing".
 */
export function scoreBand(score: number): ScoreBand {
  const value = clampScore(score)
  if (value >= 80) return 'strong'
  if (value >= 60) return 'fair'
  return 'weak'
}

/**
 * Honest but not punitive. The brand voice is a friend in the industry who will
 * actually say a resume is weak — so "weak" is the word, not a euphemism.
 */
export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  strong: 'Strong',
  fair: 'Needs work',
  weak: 'Weak',
}
