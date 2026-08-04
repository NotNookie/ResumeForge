import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

/**
 * Dev-only. Serves POST /api/analyze under `vite dev` using the same handler
 * Vercel runs, so the full flow is testable locally without `vercel dev`.
 *
 * The handler is loaded through Vite's ssrLoadModule at request time, not a
 * static import: that keeps its heavy Node deps (unpdf, mammoth) out of the
 * client build, and — critically — out of the config bundle, where the `@/`
 * alias the handler relies on isn't yet defined.
 */
export function devApiPlugin(): Plugin {
  return {
    name: 'resumeforge-dev-api',
    apply: 'serve',
    configureServer(server) {
      // Vite doesn't put non-VITE_ vars on process.env, but the server-side
      // handler reads GEMINI_API_KEY from there (as it will on Vercel). Bridge
      // the gap so local dev has the key.
      const env = loadEnv(server.config.mode, process.cwd(), '')
      if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
      }

      // Route every method to the handler (not just POST): it returns 405 for
      // the rest, matching Vercel. Falling through to next() would let Vite
      // serve the endpoint's own source file for a GET.
      server.middlewares.use('/api/analyze', (req, res) => {
        void server
          .ssrLoadModule('/api/_lib/handler.ts')
          .then((mod) => (mod as typeof import('./handler')).respondToAnalyze(req, res))
          .catch((error) => {
            console.error('[dev-api]', error)
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ failure: 'unknown' }))
          })
      })
    },
  }
}
