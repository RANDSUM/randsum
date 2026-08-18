import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { SendEnvelope, SendOutcome } from '../../src/utils/errorTracker.js'

interface TrackerModule {
  readonly initErrorTracker: (options?: { readonly send?: SendEnvelope | undefined }) => void
  readonly captureException: (error: unknown, context?: Record<string, unknown>) => void
  readonly flushErrorTracker: () => Promise<void>
}

/**
 * The tracker keeps module-level state (the parsed DSN and the in-flight set),
 * so each test re-imports it fresh with a cache-busting query string rather
 * than sharing one initialized instance across cases.
 */
async function loadTracker(): Promise<TrackerModule> {
  const suffix = Math.random().toString(36).slice(2)
  return await import(`../../src/utils/errorTracker.js?case=${suffix}`)
}

interface Captured {
  readonly url: string
  readonly body: string
}

const OK: SendOutcome = { ok: true, status: 200 }

/** A transport that records every delivery instead of performing one. */
function recorder(captured: Captured[], outcome: SendOutcome = OK): SendEnvelope {
  return (url, body) => {
    captured.push({ url, body })
    return Promise.resolve(outcome)
  }
}

function parseEvent(body: string): {
  readonly exception: { readonly values: { readonly type: string; readonly value: string }[] }
  readonly extra: Record<string, unknown>
} {
  return JSON.parse(body.split('\n')[2] ?? '{}')
}

const originalDsn = process.env['SENTRY_DSN']
const DSN = 'https://abc123@o42.ingest.sentry.io/7654321'

beforeEach(() => {
  delete process.env['SENTRY_DSN']
})

afterEach(() => {
  if (originalDsn === undefined) delete process.env['SENTRY_DSN']
  else process.env['SENTRY_DSN'] = originalDsn
})

describe('errorTracker', () => {
  test('sends an envelope to the DSN-derived ingest URL', async () => {
    process.env['SENTRY_DSN'] = DSN
    const captured: Captured[] = []

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: recorder(captured) })
    tracker.captureException(new Error('boom'), { phase: 'login' })
    await tracker.flushErrorTracker()

    expect(captured).toHaveLength(1)
    expect(captured[0]?.url).toBe(
      'https://o42.ingest.sentry.io/api/7654321/envelope/?sentry_key=abc123&sentry_version=7'
    )

    // Envelope framing: header line, item header line, then the event payload.
    const lines = (captured[0]?.body ?? '').split('\n')
    expect(lines).toHaveLength(3)
    expect(JSON.parse(lines[1] ?? '{}')).toEqual({ type: 'event' })

    const event = parseEvent(captured[0]?.body ?? '')
    expect(event.exception.values[0]?.type).toBe('Error')
    expect(event.exception.values[0]?.value).toBe('boom')
    expect(event.extra['phase']).toBe('login')
  })

  test('does not send when no DSN is configured', async () => {
    const captured: Captured[] = []

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: recorder(captured) })
    tracker.captureException(new Error('boom'))
    await tracker.flushErrorTracker()

    expect(captured).toHaveLength(0)
  })

  test('degrades to logging-only on an unparseable DSN', async () => {
    process.env['SENTRY_DSN'] = 'not-a-dsn'
    const captured: Captured[] = []

    const tracker = await loadTracker()
    expect(() => {
      tracker.initErrorTracker({ send: recorder(captured) })
    }).not.toThrow()
    tracker.captureException(new Error('boom'))
    await tracker.flushErrorTracker()

    expect(captured).toHaveLength(0)
  })

  test('a DSN with no public key is rejected rather than sent unauthenticated', async () => {
    process.env['SENTRY_DSN'] = 'https://o42.ingest.sentry.io/7654321'
    const captured: Captured[] = []

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: recorder(captured) })
    tracker.captureException(new Error('boom'))
    await tracker.flushErrorTracker()

    expect(captured).toHaveLength(0)
  })

  test('a non-2xx ingest response is tolerated', async () => {
    process.env['SENTRY_DSN'] = DSN
    const captured: Captured[] = []

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: recorder(captured, { ok: false, status: 429 }) })
    expect(() => {
      tracker.captureException(new Error('boom'))
    }).not.toThrow()
    await tracker.flushErrorTracker()

    expect(captured).toHaveLength(1)
  })

  test('a delivery failure never throws and never recurses', async () => {
    process.env['SENTRY_DSN'] = DSN
    const attempts: string[] = []
    const failing: SendEnvelope = url => {
      attempts.push(url)
      return Promise.reject(new Error('network down'))
    }

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: failing })
    expect(() => {
      tracker.captureException(new Error('boom'))
    }).not.toThrow()
    await tracker.flushErrorTracker()

    // Exactly one attempt: the failure was logged, not re-captured.
    expect(attempts).toHaveLength(1)
  })

  test('flush waits for an in-flight send to complete', async () => {
    process.env['SENTRY_DSN'] = DSN
    const settled = { done: false }
    const slow: SendEnvelope = () =>
      new Promise<SendOutcome>(resolve => {
        setTimeout(() => {
          settled.done = true
          resolve(OK)
        }, 25)
      })

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: slow })
    tracker.captureException(new Error('boom'))
    expect(settled.done).toBe(false)

    await tracker.flushErrorTracker()
    expect(settled.done).toBe(true)
  })

  test('serializes a non-Error throw instead of dropping it', async () => {
    process.env['SENTRY_DSN'] = DSN
    const captured: Captured[] = []

    const tracker = await loadTracker()
    tracker.initErrorTracker({ send: recorder(captured) })
    tracker.captureException('plain string failure')
    await tracker.flushErrorTracker()

    const event = parseEvent(captured[0]?.body ?? '')
    expect(event.exception.values[0]?.type).toBe('NonError')
    expect(event.exception.values[0]?.value).toBe('plain string failure')
  })
})
