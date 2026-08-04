import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Load .env into process.env for tests, without a dotenv dependency. Server code
 * reads process.env (as it will on Vercel); this just populates it locally so
 * the gated integration tests can reach the real AI. Missing .env is fine —
 * those tests skip when the key is absent.
 */
try {
  const envPath = fileURLToPath(new URL('../.env', import.meta.url))
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim())
    if (match) {
      const [, key, value] = match
      if (key && process.env[key] === undefined) process.env[key] = value
    }
  }
} catch {
  // No .env — integration tests that need a key will skip themselves.
}
