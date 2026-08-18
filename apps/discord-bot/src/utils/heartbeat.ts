/**
 * Dead-man's-switch heartbeat.
 *
 * This is the one signal that survives the bot being gone. Everything else in
 * this codebase reports a problem *from inside* the process: the error tracker
 * needs something to throw, and the gateway watchdog needs the event loop to be
 * turning. A process that is dead, OOM-killed, or never restarted after a failed
 * deploy emits nothing at all — and on 2026-08-18 that shape of failure cost an
 * hour, because every dashboard stayed green while the bot sat disconnected.
 *
 * A Discord gateway bot also has no inbound HTTP endpoint, so nothing external
 * can poll it the way you would poll a web server. Liveness therefore has to be
 * pushed rather than pulled: the bot pings a URL on a schedule, and the alert
 * fires when the pings *stop*.
 *
 * Deliberately unconditional on gateway state. This answers "is the process
 * alive", nothing more — `gateway.ts` already answers "is it connected", and
 * conflating the two would make a stalled-but-running bot indistinguishable from
 * a dead one, which is precisely the distinction that was missing.
 */
import type { LogFields } from './logger.js'
import { logger } from './logger.js'

/** A hung ping must never pile up behind the next one. */
const PING_TIMEOUT_MS = 5000
const DEFAULT_INTERVAL_MS = 60 * 1000

export type PingFn = (url: string) => Promise<void>

const defaultPing: PingFn = async url => {
  await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(PING_TIMEOUT_MS)
  })
}

const state: {
  url: string | undefined
  ping: PingFn
  timer: ReturnType<typeof setInterval> | undefined
  failures: number
} = {
  url: undefined,
  ping: defaultPing,
  timer: undefined,
  failures: 0
}

export interface HeartbeatOptions {
  /** Injected in tests; defaults to a real `fetch`. */
  readonly ping?: PingFn | undefined
  readonly intervalMs?: number | undefined
}

/**
 * Send one heartbeat. Never throws — a monitoring failure must not become an
 * outage, and a missed ping is self-correcting because the next one is a minute
 * away. Repeated failures are logged, but deliberately not routed through
 * `captureException`: if the network is down, the error path is down too, and
 * the heartbeat's *absence* is already the alert.
 */
export async function sendHeartbeat(): Promise<void> {
  const url = state.url
  if (url === undefined) return

  try {
    await state.ping(url)
    if (state.failures > 0) {
      logger.info('heartbeat.recovered', { afterFailures: state.failures })
      state.failures = 0
    }
  } catch (error) {
    state.failures += 1
    const fields: LogFields = { consecutiveFailures: state.failures, error }
    logger.warn('heartbeat.failed', fields)
  }
}

/**
 * Begin pinging. A no-op when `HEALTHCHECK_URL` is unset, so the bot runs
 * identically with monitoring switched off.
 */
export function startHeartbeat(options: HeartbeatOptions = {}): void {
  if (state.timer !== undefined) return

  const configured = process.env['HEALTHCHECK_URL']
  state.ping = options.ping ?? defaultPing

  if (configured === undefined || configured.length === 0) {
    logger.info('heartbeat.init', { enabled: false })
    return
  }

  state.url = configured
  logger.info('heartbeat.init', { enabled: true })

  // Ping immediately so a restart is visible without waiting a full interval —
  // the gap around a crash-restart is exactly what the monitor is watching for.
  void sendHeartbeat()

  const timer = setInterval(() => {
    void sendHeartbeat()
  }, options.intervalMs ?? DEFAULT_INTERVAL_MS)
  if (typeof timer.unref === 'function') {
    timer.unref()
  }
  state.timer = timer
}

export function stopHeartbeat(): void {
  if (state.timer === undefined) return
  clearInterval(state.timer)
  state.timer = undefined
}
