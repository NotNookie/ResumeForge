import type { IncomingMessage, ServerResponse } from 'node:http'
import { respondToAnalyze } from './_lib/handler'

/**
 * Vercel serverless entry for POST /api/analyze. All logic lives in the shared
 * handler so the same code path runs here and under Vite dev middleware.
 *
 * The default JSON body parsing is fine to leave on: the client sends
 * application/octet-stream, which Vercel hands us as a Buffer on req.body, and
 * the handler reads that directly.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return respondToAnalyze(req, res)
}
