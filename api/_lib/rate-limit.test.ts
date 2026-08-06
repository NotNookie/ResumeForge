import { describe, expect, it } from 'vitest'
import { checkRateLimit, type RateLimitStore } from './rate-limit'

const WINDOW_MS = 10 * 60_000
const MAX = 8

describe('checkRateLimit', () => {
  it('allows requests up to the limit, then blocks', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < MAX; i++) {
      expect(checkRateLimit(store, '1.2.3.4', 1000 + i).allowed).toBe(true)
    }
    expect(checkRateLimit(store, '1.2.3.4', 2000).allowed).toBe(false)
  })

  it('tracks IPs independently', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < MAX; i++) checkRateLimit(store, 'a', 1000 + i)
    // 'a' is now at its limit, but 'b' is untouched.
    expect(checkRateLimit(store, 'a', 2000).allowed).toBe(false)
    expect(checkRateLimit(store, 'b', 2000).allowed).toBe(true)
  })

  it('lets an IP through again once its hits age out of the window', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < MAX; i++) checkRateLimit(store, 'x', 1000)
    expect(checkRateLimit(store, 'x', 1000).allowed).toBe(false)
    // Well past the window: the old hits no longer count.
    expect(checkRateLimit(store, 'x', 1000 + WINDOW_MS + 1).allowed).toBe(true)
  })

  it('does not count a blocked request against a later allowed one', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < MAX; i++) checkRateLimit(store, 'y', 1000 + i)
    checkRateLimit(store, 'y', 1500) // blocked
    checkRateLimit(store, 'y', 1600) // blocked
    // After the window, exactly one allowed hit should be possible again.
    expect(checkRateLimit(store, 'y', 1000 + WINDOW_MS + 1).allowed).toBe(true)
  })
})
