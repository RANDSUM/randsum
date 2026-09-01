/**
 * Error-tracker seam.
 *
 * A single `captureException` entry point with per-interaction correlation
 * context, emitted as one structured log line.
 *
 * **Remote delivery used to live here and no longer does.** It spoke Sentry's
 * envelope protocol and posted to a Discord webhook, configured through
 * `SENTRY_DSN` and `DISCORD_ERROR_WEBHOOK_URL` — Render dashboard variables,
 * initialized by the gateway process's `initErrorTracker()` call. All three are
 * gone: Render, the process, and the vars. The machinery could not have run on
 * workerd anyway, because it read `process.env`, and `flushErrorTracker` existed
 * to drain in-flight sends before a deliberate `process.exit` — a concept a
 * Worker does not have.
 *
 * What consumes this now is **Cloudflare Workers Observability**, enabled in
 * `wrangler.jsonc`, which ingests exactly this: structured lines off stdout.
 *
 * The seam is kept rather than inlined into callers so that re-adding delivery
 * stays a change to this module's body, with no call site touched — but it would
 * need to take its config from the Worker's `env` argument, not `process`.
 *
 * The invariant that still holds: capturing an error of any shape — an `Error`,
 * a string, `undefined` — does not throw, so a tracker problem cannot become an
 * outage. The one exception is inherited, not new: `logger` serializes with
 * `JSON.stringify`, so a context object containing a circular reference throws
 * at the log call. No caller passes one today.
 */
import { logger } from './logger.js'

export interface ErrorContext {
  readonly command?: string | undefined
  readonly interactionId?: string | undefined
  readonly userId?: string | undefined
  readonly guildId?: string | undefined
  readonly [key: string]: unknown
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  logger.error('exception.captured', {
    ...context,
    error
  })
}
