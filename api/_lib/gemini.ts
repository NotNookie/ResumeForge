import { analysisSchema, type Analysis } from '@/schemas/analysis'
import { buildAnalysisPrompt } from './prompt'

/** The AI is temporarily rate-limited (free-tier quota, or a burst of load). */
export class RateLimitedError extends Error {
  constructor(message = 'The analysis service is rate limited.') {
    super(message)
    this.name = 'RateLimitedError'
  }
}

/** The AI call failed for any other reason: network, bad key, safety block, or
 * output that never validated. From the user's side these are all "try again". */
export class AiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AiUnavailableError'
  }
}

// The "-latest" alias tracks the current flash model, so the app doesn't 404
// when a pinned version is retired for new users (which is exactly what happened
// to gemini-2.5-flash). Trades a little behavioural drift for not breaking.
const MODEL = 'gemini-flash-latest'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

/**
 * Send the resume text to Gemini and return a validated Analysis.
 *
 * The model's output is untrusted: it can return prose, drift field names, or
 * send a score as a string. So every response is parsed through the Zod schema,
 * and a single validation failure is retried once before giving up — the second
 * attempt usually lands, and one retry keeps free-tier token use sane.
 */
export async function analyzeResumeText(resumeText: string): Promise<Analysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AiUnavailableError('GEMINI_API_KEY is not set in the server environment.')
  }

  const prompt = buildAnalysisPrompt(resumeText)

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await requestCompletion(prompt, apiKey)
    const parsed = analysisSchema.safeParse(safeJsonParse(raw))
    if (parsed.success) return parsed.data
    lastError = parsed.error
  }

  throw new AiUnavailableError('The AI returned a response we could not read.', { cause: lastError })
}

/** One round trip to Gemini, returning the raw JSON text of the first candidate. */
async function requestCompletion(prompt: string, apiKey: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 4096,
          // Cap "thinking" to a small budget. This is structured extraction, not
          // deep reasoning, so a large thinking budget just adds latency. A
          // budget of 0 is rejected by this model (HTTP 400); 128 is the floor
          // that's accepted and roughly halves response time.
          thinkingConfig: { thinkingBudget: 128 },
        },
      }),
    })
  } catch (error) {
    throw new AiUnavailableError('Could not reach the analysis service.', { cause: error })
  }

  if (response.status === 429) throw new RateLimitedError()
  if (!response.ok) {
    throw new AiUnavailableError(`Analysis service returned HTTP ${response.status}.`)
  }

  const body: unknown = await response.json()
  const text = firstCandidateText(body)
  if (text === null) {
    // No text part usually means a safety block or an empty candidate list.
    throw new AiUnavailableError('The AI returned no usable content.')
  }
  return text
}

/** Pull candidates[0].content.parts[0].text out of Gemini's response shape. */
function firstCandidateText(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const candidates = (body as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return null
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts
  if (!Array.isArray(parts)) return null
  const text = (parts[0] as { text?: unknown })?.text
  return typeof text === 'string' ? text : null
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null // a non-object fails schema validation, which drives the retry
  }
}
