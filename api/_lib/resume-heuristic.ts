/**
 * A cheap, AI-free check for whether extracted text reads like a resume, run
 * before the expensive model call so an obvious non-resume (a cover letter, an
 * essay, a random PDF) is caught in under a millisecond instead of after ~20s.
 *
 * It is deliberately rough. Heuristics can't reliably tell an unconventional
 * resume from a well-structured cover letter, so this never hard-blocks — the
 * UI shows a warning with an "analyze anyway" escape hatch. Bias toward letting
 * borderline documents through; only flag the clearly-not-a-resume.
 */

export type ResumeVerdict = { isResume: true } | { isResume: false; reason: string }

/** Section headings that a resume almost always has and prose rarely does. */
const SECTION_KEYWORDS = [
  'experience',
  'education',
  'skills',
  'employment',
  'work history',
  'projects',
  'certifications',
  'summary',
  'objective',
  'volunteer',
  'awards',
  'publications',
  'references',
]

/** Phrases that mark a cover letter — a document type we specifically exclude. */
const COVER_LETTER_MARKERS = [
  'dear hiring',
  'dear sir',
  'dear madam',
  'to whom it may concern',
  'sincerely',
  'yours faithfully',
  'yours sincerely',
  'i am writing to',
  'i am excited to apply',
  'please find attached',
]

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/
// A loose run of 7+ digits with common separators — catches most phone formats
// without trying to be a strict validator.
const PHONE = /\+?\d[\d\s().-]{7,}\d/
const YEAR = /\b(19|20)\d{2}\b/

export function looksLikeResume(text: string): ResumeVerdict {
  const lower = text.toLowerCase()

  const sectionHits = SECTION_KEYWORDS.filter((word) => lower.includes(word)).length
  const coverLetterHits = COVER_LETTER_MARKERS.filter((phrase) => lower.includes(phrase)).length
  const hasContact = EMAIL.test(text) || PHONE.test(text)
  const hasYear = YEAR.test(text)

  // A cover letter has contact details and career words too, so the tell is
  // prose-letter phrasing paired with few resume sections.
  if (coverLetterHits >= 2 && sectionHits < 3) {
    return {
      isResume: false,
      reason: 'This reads more like a cover letter than a resume. ResumeForge scores resumes.',
    }
  }

  // The core signal: several resume sections, some contact detail, and dates.
  // Two of these three, plus at least two sections, is enough to pass — the
  // escape hatch covers the rest.
  const strongSignals = [sectionHits >= 2, hasContact, hasYear].filter(Boolean).length
  if (sectionHits >= 2 && strongSignals >= 2) {
    return { isResume: true }
  }

  return {
    isResume: false,
    reason:
      "We couldn't find the usual resume markers — contact details and sections like Experience, Education, or Skills.",
  }
}
