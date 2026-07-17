import type { ScoreBand } from '@/lib/scoring'

/**
 * The headline is the most prominent text on the results page, so it states the
 * verdict in words rather than repeating the number below it.
 *
 * Name extraction fails on unusual resumes, so every band has a nameless form.
 * These are separate sentences, not string interpolation with a fallback — a
 * greeting reads wrong without a name to greet.
 */
const HEADLINE: Record<ScoreBand, { named: (name: string) => string; anonymous: string }> = {
  strong: {
    named: (name) => `Strong work, ${name}.`,
    anonymous: 'This is a strong resume.',
  },
  fair: {
    named: (name) => `Almost there, ${name}.`,
    anonymous: 'Almost there.',
  },
  weak: {
    named: (name) => `Some work to do, ${name}.`,
    anonymous: 'This resume needs work.',
  },
}

export function verdictHeadline(band: ScoreBand, name: string | null): string {
  const copy = HEADLINE[band]
  const trimmed = name?.trim()
  return trimmed ? copy.named(firstName(trimmed)) : copy.anonymous
}

/**
 * Resumes carry a full legal name; the headline wants the first name only.
 * Falls back to the whole string for mononyms and unexpected formats.
 */
function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName
}
