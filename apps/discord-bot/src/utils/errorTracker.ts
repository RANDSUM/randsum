/**
 * Error-tracker seam.
 *
 * Provides a single `captureException` entry point with per-interaction
 * correlation context. Every capture is logged as a structured line; when
 * `SENTRY_DSN` is set, it is *also* delivered to Sentry.
 *
 * `@sentry/node` is deliberately not a dependency: it would meaningfully grow
 * the bundled worker, and the only thing this bot needs is "POST one event".
 * Sentry's ingest API is plain HTTP, so `forwardToSentry` speaks the envelope
 * protocol directly over `fetch` — zero install weight, zero bundle growth. If
 * richer features are ever wanted (breadcrumbs, tracing, auto-instrumentation),
 * swapping this module's body for `@sentry/node` is still a contained change,
 * because no call site knows how delivery happens.
 *
 * Two invariants hold no matter what:
 *
 * 1. **Tracking never throws.** A tracker problem must not become an outage,
 *    and a delivery failure is logged with `logger.warn` rather than routed
 *    back through `captureException` (which would recurse).
 * 2. **Captures survive a deliberate exit.** Delivery is asynchronous, so a
 *    caller that captures and then calls `process.exit` would drop the event —
 *    which is exactly the fatal-login path that matters most. `flushErrorTracker`
 *    awaits in-flight sends so those paths can shut down without losing the
 *    one event explaining why.
 */
import { randomUUID } from 'node:crypto'
import { logger } from './logger.js'

export interface ErrorContext {
  readonly command?: string | undefined
  readonly interactionId?: string | undefined
  readonly userId?: string | undefined
  readonly guildId?: string | undefined
  readonly [key: string]: unknown
}

/** Resolved ingest target derived from the DSN. */
interface SentryTarget {
  readonly url: string
}

/** Outcome of one delivery attempt — the only part of `Response` used here. */
export interface SendOutcome {
  readonly ok: boolean
  readonly status: number
}

/**
 * Minimal transport surface — lets tests inject a fake with no network, the
 * same way `syncCommands` accepts a `RestLike`.
 */
export type SendEnvelope = (url: string, body: string) => Promise<SendOutcome>

/** A hung ingest request must never outlive the shutdown it is reporting on. */
const SEND_TIMEOUT_MS = 5000

const defaultSend: SendEnvelope = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-sentry-envelope' },
    body,
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
  })
  return { ok: response.ok, status: response.status }
}

const trackerState: {
  dsn: string | undefined
  target: SentryTarget | undefined
  send: SendEnvelope
} = { dsn: undefined, target: undefined, send: defaultSend }

/** In-flight deliveries, awaited by `flushErrorTracker`. */
const pending = new Set<Promise<void>>()

/**
 * Derive Sentry's envelope endpoint from a DSN.
 *
 * A DSN is `<scheme>://<publicKey>@<host><path>/<projectId>`; the ingest URL is
 * the same origin plus `/api/<projectId>/envelope/`, authenticated by the public
 * key as a query parameter. Returns `undefined` for anything unparseable so a
 * typo'd DSN degrades to "logging only" instead of throwing at boot.
 */
function parseDsn(dsn: string): SentryTarget | undefined {
  try {
    const parsed = new URL(dsn)
    const publicKey = parsed.username
    const segments = parsed.pathname.split('/').filter(segment => segment !== '')
    const projectId = segments.at(-1)
    if (publicKey === '' || projectId === undefined) return undefined
    const prefix = segments.slice(0, -1).join('/')
    const base = `${parsed.protocol}//${parsed.host}${prefix === '' ? '' : `/${prefix}`}`
    return {
      url: `${base}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`
    }
  } catch {
    return undefined
  }
}

export interface InitOptions {
  /** Injected in tests; defaults to a real `fetch` POST. */
  readonly send?: SendEnvelope | undefined
}

export function initErrorTracker(options: InitOptions = {}): void {
  trackerState.send = options.send ?? defaultSend

  const configured = process.env['SENTRY_DSN']
  if (configured === undefined || configured.length === 0) {
    logger.info('errorTracker.init', { tracker: 'none', enabled: false })
    return
  }

  const target = parseDsn(configured)
  if (target === undefined) {
    // Loud, because a malformed DSN looks identical to a working one from the
    // dashboard: the service comes up and simply never reports.
    logger.error('errorTracker.init', {
      tracker: 'sentry',
      enabled: false,
      reason: 'invalid_dsn'
    })
    return
  }

  trackerState.dsn = configured
  trackerState.target = target
  logger.info('errorTracker.init', { tracker: 'sentry', enabled: true })
}

interface DescribedError {
  readonly type: string
  readonly value: string
  readonly stack: string | undefined
}

/** Reduce an unknown thrown value to Sentry's `exception` shape. */
function describeError(error: unknown): DescribedError {
  if (error instanceof Error) {
    return { type: error.name, value: error.message, stack: error.stack }
  }
  return { type: 'NonError', value: String(error), stack: undefined }
}

/**
 * POST one event as a Sentry envelope. Resolves in every case — a tracker that
 * rejects would surface as an unhandled rejection on an error path.
 */
async function postEnvelope(
  target: SentryTarget,
  error: unknown,
  context: ErrorContext
): Promise<void> {
  try {
    const eventId = randomUUID().replaceAll('-', '')
    const described = describeError(error)
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: 'node',
      level: 'error',
      logger: 'randsum-discord-bot',
      environment: process.env['NODE_ENV'] ?? 'production',
      exception: {
        values: [{ type: described.type, value: described.value }]
      },
      extra: { ...context, stack: described.stack }
    }

    const body = [
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
      JSON.stringify({ type: 'event' }),
      JSON.stringify(event)
    ].join('\n')

    const outcome = await trackerState.send(target.url, body)

    if (!outcome.ok) {
      logger.warn('errorTracker.send_failed', { status: outcome.status })
    }
  } catch (sendError) {
    // Deliberately `logger.warn`, never `captureException`: routing a delivery
    // failure back through the tracker would recurse until the stack blows.
    logger.warn('errorTracker.send_failed', { error: sendError })
  }
}

function forwardToSentry(error: unknown, context: ErrorContext): void {
  const target = trackerState.target
  if (target === undefined) return

  const send = postEnvelope(target, error, context)
  pending.add(send)
  void send.then(() => {
    pending.delete(send)
  })
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  logger.error('exception.captured', {
    ...context,
    error
  })
  if (trackerState.target !== undefined) {
    forwardToSentry(error, context)
  }
}

/**
 * Await every in-flight delivery. Call before any deliberate `process.exit` so
 * the event explaining the exit is not dropped with the process.
 */
export async function flushErrorTracker(): Promise<void> {
  await Promise.allSettled([...pending])
}
