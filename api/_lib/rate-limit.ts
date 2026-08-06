import type { IncomingMessage } from 'node:http'

/**
 * Best-effort, in-memory rate limiting.
 *
 * IMPORTANT: this is per-instance. Serverless spins up many instances and
 * recycles them, so a determined attacker spread across instances gets through,
 * and the counts reset on cold start. It is a speed bump against casual abuse
 * and accidental double-submits, not a security control. A real limit would need
 * a shared store (Redis); this deliberately trades that for zero new infra.
 */

const WINDOW_MS = 10 * 60_000 // 10 minutes
const MAX_IN_WINDOW = 8 // generous for a real user (1-3 analyses), stops spam
const MAX_TRACKED_IPS = 5_000 // bound memory if the map is ever flooded

export type RateLimitStore = Map<string, number[]>

/**
 * Records a hit for `ip` and reports whether it's allowed. Pure except for
 * mutating the passed store; `now` is injected so it's testable without clocks.
 */
export function checkRateLimit(
  store: RateLimitStore,
  ip: string,
  now: number = Date.now(),
): { allowed: boolean } {
  const recent = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_IN_WINDOW) {
    store.set(ip, recent) // keep the pruned list; don't count the blocked hit
    return { allowed: false }
  }

  recent.push(now)
  store.set(ip, recent)
  pruneIfLarge(store, now)
  return { allowed: true }
}

/** Drop stale entries only when the map grows large, so the common path stays O(1). */
function pruneIfLarge(store: RateLimitStore, now: number): void {
  if (store.size <= MAX_TRACKED_IPS) return
  for (const [ip, times] of store) {
    const live = times.filter((t) => now - t < WINDOW_MS)
    if (live.length === 0) store.delete(ip)
    else store.set(ip, live)
  }
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for (client is the first hop);
 * fall back to the socket address in local dev. Spoofable, which is another
 * reason this is a speed bump, not a gate.
 */
export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (value) return value.split(',')[0]?.trim() || 'unknown'
  return req.socket?.remoteAddress ?? 'unknown'
}

/** The process-wide store for the running instance. */
export const rateLimitStore: RateLimitStore = new Map()
