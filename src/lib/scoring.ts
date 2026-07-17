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
