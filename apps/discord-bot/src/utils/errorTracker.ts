/**
 * Error-tracker seam.
 *
 * Provides a single `captureException` entry point with per-interaction
 * correlation context. Today it logs a structured line via the logger; it is
 * deliberately a thin seam so an external tracker (e.g. Sentry) can be wired in
 * without touching any call site.
 *
 * Sentry is intentionally NOT a dependency: `@sentry/node` would meaningfully
 * grow the bundled worker for a single-instance bot. Instead, `initErrorTracker`
 * reads `SENTRY_DSN` and, when present, records that a DSN is configured and
 * routes captures through `forwardToSentry`. The forwarder is currently a no-op
 * stub — swap its body for `Sentry.captureException(error, { extra: context })`
 * (and add the `@sentry/node` import + `Sentry.init({ dsn })` in
 * `initErrorTracker`) to activate real reporting. The env var is documented in
 * `.env.example`.
 */
import { logger } from './logger.js'

export interface ErrorContext {
  readonly command?: string | undefined
  readonly interactionId?: string | undefined
  readonly userId?: string | undefined
  readonly guildId?: string | undefined
  readonly [key: string]: unknown
}

const trackerState: { dsn: string | undefined } = { dsn: undefined }

export function initErrorTracker(): void {
  const configured = process.env['SENTRY_DSN']
  if (configured !== undefined && configured.length > 0) {
    trackerState.dsn = configured
    logger.info('errorTracker.init', { tracker: 'sentry', enabled: true })
    // To activate Sentry: import * as Sentry from '@sentry/node' and call
    // Sentry.init({ dsn }) here, then implement forwardToSentry below.
  } else {
    logger.info('errorTracker.init', { tracker: 'none', enabled: false })
  }
}

function forwardToSentry(_error: unknown, _context: ErrorContext): void {
  // No-op stub. When @sentry/node is added, replace with:
  //   Sentry.captureException(_error, { extra: _context })
  // Guarded by `dsn !== undefined` at the call site.
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  logger.error('exception.captured', {
    ...context,
    error
  })
  if (trackerState.dsn !== undefined) {
    forwardToSentry(error, context)
  }
}
