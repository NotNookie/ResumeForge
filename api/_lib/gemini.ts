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
 * output that never validated. From the user's side these are all "try again".
 *
 * `retryable` marks the transient causes (a 503 "high demand", a dropped
 * connection) worth another attempt, versus terminal ones (a 400, a safety
 * block) where retrying only burns time. */
export class AiUnavailableError extends Error {
  readonly retryable: boolean
  constructor(message: string, options?: { cause?: unknown; retryable?: boolean }) {
    super(message, options)
    this.name = 'AiUnavailableError'
    this.retryable = options?.retryable ?? false
  }
}

// The "-latest" alias tracks the current flash model, so the app doesn't 404
// when a pinned version is retired for new users (which is exactly what happened
// to gemini-2.5-flash). Trades a little behavioural drift for not breaking.
const MODEL = 'gemini-flash-latest'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// On the free tier the model frequently returns a fast 503 ("high demand") for
// a large generation while smaller requests succeed. A 503 rejects in ~2s but a
// success takes 20-40s, so retrying a 503 is cheap and often lands. The retry
// loop is bounded by wall-clock time, not just attempt count, because a couple
// of slow calls would otherwise blow past the serverless timeout.
const TOTAL_BUDGET_MS = 50_000 // under Vercel's 60s maxDuration, with headroom
const MIN_CALL_MS = 6_000 // don't start an attempt that can't plausibly finish
const MAX_ATTEMPTS = 3 // each attempt is a paid call, so keep this tight
const MAX_VALIDATION_RETRIES = 1 // one re-ask for bad JSON, then stop wasting tokens
const BACKOFF_MS = [800, 1600]

/**
 * Send the resume text to Gemini and return a validated Analysis.
 *
 * Retries a transient server error (503/network) freely within the budget, but
 * a validation failure (the model returned unparseable/off-schema JSON) buys
 * only one re-ask — a second bad response won't improve on a third, and each
 * attempt costs tokens. A 429 (quota) is surfaced immediately, never retried.
 * Every attempt shares one deadline and each fetch is aborted at the remaining
 * budget, so the whole call returns within TOTAL_BUDGET_MS.
 */
export async function analyzeResumeText(
  resumeText: string,
  jobDescription?: string,
): Promise<Analysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AiUnavailableError('GEMINI_API_KEY is not set in the server environment.')
  }

  const prompt = buildAnalysisPrompt(resumeText, jobDescription)
  const deadline = Date.now() + TOTAL_BUDGET_MS

  let lastError: unknown
  let validationFailures = 0
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now()
    if (remaining < MIN_CALL_MS) break

    try {
      const raw = await requestCompletion(prompt, apiKey, remaining)
      const parsed = analysisSchema.safeParse(safeJsonParse(raw))
      if (parsed.success) return parsed.data

      // Bad JSON. Re-ask once; beyond that it's not going to fix itself.
      lastError = parsed.error
      if (++validationFailures > MAX_VALIDATION_RETRIES) break
    } catch (error) {
      if (error instanceof RateLimitedError) throw error // quota — don't retry
      if (error instanceof AiUnavailableError && !error.retryable) throw error
      lastError = error
    }

    const backoff = BACKOFF_MS[attempt]
    if (backoff !== undefined && deadline - Date.now() > backoff + MIN_CALL_MS) {
      await sleep(backoff)
    }
  }

  throw new AiUnavailableError('The AI did not return a usable response in time.', {
    cause: lastError,
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** One round trip to Gemini, aborted after `timeoutMs`, returning the raw JSON
 * text of the first candidate. */
async function requestCompletion(
  prompt: string,
  apiKey: string,
  timeoutMs: number,
): Promise<string> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: abort.signal,
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
    // Abort (out of time) is terminal; a dropped connection is transient.
    throw new AiUnavailableError('Could not reach the analysis service.', {
      cause: error,
      retryable: !abort.signal.aborted,
    })
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429) throw new RateLimitedError()
  if (!response.ok) {
    // 5xx (notably 503 "high demand") is transient; 4xx is our fault and won't
    // improve on retry.
    throw new AiUnavailableError(`Analysis service returned HTTP ${response.status}.`, {
      retryable: response.status >= 500,
    })
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
