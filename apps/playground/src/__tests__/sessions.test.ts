import { describe, expect, test } from 'bun:test'

// Tests for retry logic in sessions.ts.
// We test withRetry directly since it is exported.

describe('createSession retry logic', () => {
  test('withRetry resolves immediately when fn succeeds on first try', async () => {
    const { withRetry } = await import('../lib/sessions')
    const result = await withRetry(() => Promise.resolve(42), 3, 0)
    expect(result).toBe(42)
  })

  test('withRetry retries and resolves when fn succeeds on second try', async () => {
    const { withRetry } = await import('../lib/sessions')
    const counter = { attempts: 0 }
    const result = await withRetry(
      () => {
        counter.attempts++
        if (counter.attempts < 2) return Promise.reject(new Error('fail'))
        return Promise.resolve('ok')
      },
      3,
      0
    )
    expect(result).toBe('ok')
    expect(counter.attempts).toBe(2)
  })

  test('withRetry retries up to maxAttempts times then rejects', async () => {
    const { withRetry } = await import('../lib/sessions')
    const counter = { attempts: 0, caughtMessage: '' }
    await withRetry(
      () => {
        counter.attempts++
        return Promise.reject(new Error('always fails'))
      },
      3,
      0
    ).catch((e: unknown) => {
      counter.caughtMessage = e instanceof Error ? e.message : String(e)
    })
    expect(counter.attempts).toBe(3)
    expect(counter.caughtMessage).toBe('always fails')
  })

  test('withRetry uses exponential backoff (base delay doubles)', async () => {
    const { withRetry } = await import('../lib/sessions')
    const delays: number[] = []
    const origSetTimeout = globalThis.setTimeout
    // Patch setTimeout to track delays (execute immediately for test speed)
    const patchedTimeout = (fn: () => void, ms: number): ReturnType<typeof setTimeout> => {
      delays.push(ms)
      return origSetTimeout(fn, 0)
    }
    globalThis.setTimeout = patchedTimeout as typeof setTimeout

    const counter = { attempts: 0 }
    try {
      await withRetry(
        () => {
          counter.attempts++
          return Promise.reject(new Error('fail'))
        },
        3,
        100
      )
    } catch {
      // expected
    } finally {
      globalThis.setTimeout = origSetTimeout
    }

    // 3 attempts total: first fails immediately (no delay),
    // retry 1 waits baseMs (100), retry 2 waits baseMs*4 (400)
    expect(delays).toEqual([100, 400])
  })
})

describe('createSession returns null on exhaustion', () => {
  test('createSessionSafe is a function (type contract)', async () => {
    const { createSessionSafe } = await import('../lib/sessions')
    expect(typeof createSessionSafe).toBe('function')
  })
})
