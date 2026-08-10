import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  runAnalysis,
  statusForFailure,
  toAnalysisFailure,
  MAX_UPLOAD_BYTES,
  NotAResumeError,
} from './pipeline.js'
import { checkRateLimit, clientIp, rateLimitStore } from './rate-limit.js'

/** Thrown mid-stream when an upload exceeds the cap, so we stop reading rather
 * than buffer the whole oversized payload before rejecting it. */
class OversizeError extends Error {}

/**
 * Framework-agnostic POST /api/analyze handler, written against Node's base
 * request/response types so the exact same code runs as a Vercel function and
 * as Vite dev middleware. Adapters stay one line each.
 */
export async function respondToAnalyze(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return sendJson(res, 405, { failure: 'unknown' })

  // Reject before spending any work (body read, extraction, AI) on abuse. Reuses
  // the rateLimited failure screen, so the user sees "try again in a bit".
  if (!checkRateLimit(rateLimitStore, clientIp(req)).allowed) {
    return sendJson(res, 429, { failure: 'rateLimited' })
  }

  try {
    const bytes = await readBodyBytes(req)
    if (bytes.byteLength === 0) return sendJson(res, 400, { failure: 'unknown' })
    if (bytes.byteLength > MAX_UPLOAD_BYTES) return sendJson(res, 413, { failure: 'unknown' })

    const filename = readFilename(req)
    // "x-force-analyze: 1" is the analyze-anyway override for the resume check.
    const force = req.headers['x-force-analyze'] === '1'
    // The optional job description rides in a header (URL-encoded), not the body,
    // which stays the raw file. The client caps its length; the pipeline caps it
    // again.
    const jobDescription = readJobDescription(req)
    const analysis = await runAnalysis(bytes, filename, { force, jobDescription })
    return sendJson(res, 200, analysis)
  } catch (error) {
    if (error instanceof OversizeError) return sendJson(res, 413, { failure: 'unknown' })
    // Not a failure the user must fix — a warning they can override. Distinct
    // body shape (notResume, not failure) so the client can offer "analyze anyway".
    if (error instanceof NotAResumeError) {
      return sendJson(res, 422, { notResume: true, reason: error.reason })
    }
    const failure = toAnalysisFailure(error)
    // Server-side visibility; the client only ever sees the failure code.
    if (failure === 'unknown' || failure === 'aiUnavailable') console.error('[analyze]', error)
    return sendJson(res, statusForFailure(failure), { failure })
  }
}

/**
 * Vercel pre-parses the body into req.body (a Buffer for octet-stream); Vite
 * middleware leaves the raw stream. Handle both: use the buffer if present,
 * otherwise drain the stream — enforcing the size cap as we read so an
 * oversized upload can't exhaust memory first.
 */
async function readBodyBytes(req: IncomingMessage): Promise<Uint8Array> {
  const preParsed = (req as { body?: unknown }).body
  if (preParsed instanceof Uint8Array) return preParsed

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req as AsyncIterable<Buffer>) {
    total += chunk.byteLength
    if (total > MAX_UPLOAD_BYTES) throw new OversizeError()
    chunks.push(chunk)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

/** The filename rides in a header, URL-encoded to survive unicode. Best-effort
 * only — it's used for the error message, never trusted for format detection. */
function readFilename(req: IncomingMessage): string {
  const header = req.headers['x-filename']
  const raw = Array.isArray(header) ? header[0] : header
  if (!raw) return 'the file'
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** The optional job description, URL-encoded in a header. Undefined when absent
 * or empty; the pipeline enforces the real length cap. */
function readJobDescription(req: IncomingMessage): string | undefined {
  const header = req.headers['x-job-description']
  const raw = Array.isArray(header) ? header[0] : header
  if (!raw) return undefined
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    decoded = raw
  }
  return decoded.trim() || undefined
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}
