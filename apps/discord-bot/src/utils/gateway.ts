/**
 * Gateway connection observability.
 *
 * The bot's liveness used to be unobservable. `index.ts` registered
 * `ClientReady`, `InteractionCreate`, `GuildCreate` and `client.on('error')` —
 * but nothing for the shard lifecycle. So a dropped WebSocket left the process
 * alive, the 5-minute `metrics.flush` heartbeat ticking, and Render reporting a
 * perfectly healthy worker, while the bot sat offline in Discord.
 *
 * This is not hypothetical. On 2026-08-18 `client.login()` hung for a full hour
 * between `bot.connecting` and `bot.login_succeeded` without emitting one line:
 * the hang was *inside* login, and `loginWithBackoff` only logs when a call
 * rejects. The outage was invisible in Render, invisible in the logs, and
 * visible only to people trying to use the bot.
 *
 * Two fixes here. Every gateway transition becomes a log line, and
 * `gatewaySnapshot()` lets the heartbeat carry liveness instead of implying it.
 * The second matters as much as the first: a heartbeat proving only "the event
 * loop is turning" is worse than no heartbeat, because it reads as health while
 * saying nothing about the connection.
 *
 * Deliberately **no auto-restart** on a stalled connection. Discord throttles
 * session starts, and an hour-long login is consistent with exactly that, so a
 * watchdog that exited would deepen the hole it was trying to climb out of.
 * This escalates to the error tracker and leaves the decision to a human.
 */
import { Events } from './discord.js'
import type { Client } from './discord.js'
import type { LogFields } from './logger.js'
import { logger } from './logger.js'
import { captureException } from './errorTracker.js'

export type GatewayStatus = 'connecting' | 'ready' | 'reconnecting' | 'disconnected'

/** What happened, as opposed to the status it puts us in (`resumed` → ready). */
export type GatewayEvent = 'connecting' | 'ready' | 'resumed' | 'reconnecting' | 'disconnected'

const STATUS_FOR: Readonly<Record<GatewayEvent, GatewayStatus>> = {
  connecting: 'connecting',
  ready: 'ready',
  resumed: 'ready',
  reconnecting: 'reconnecting',
  disconnected: 'disconnected'
}

const LEVEL_FOR: Readonly<Record<GatewayEvent, 'info' | 'warn'>> = {
  connecting: 'info',
  ready: 'info',
  resumed: 'info',
  reconnecting: 'warn',
  disconnected: 'warn'
}

/** Anything other than `ready` for longer than this is reported, once. */
const STALL_THRESHOLD_MS = 5 * 60 * 1000
const WATCHDOG_INTERVAL_MS = 60 * 1000

const state: {
  status: GatewayStatus
  changedAt: number
  disconnects: number
  resumes: number
  alarmed: boolean
} = {
  status: 'connecting',
  changedAt: Date.now(),
  disconnects: 0,
  resumes: 0,
  alarmed: false
}

export interface GatewaySnapshot {
  readonly status: GatewayStatus
  readonly connected: boolean
  /** How long the current status has held — the number that exposes a stall. */
  readonly forMs: number
  readonly disconnects: number
  readonly resumes: number
}

export function gatewaySnapshot(): GatewaySnapshot {
  return {
    status: state.status,
    connected: state.status === 'ready',
    forMs: Date.now() - state.changedAt,
    disconnects: state.disconnects,
    resumes: state.resumes
  }
}

/**
 * Record a gateway transition and log it. `fields` carries event-specific
 * detail (shard id, close code) straight into the structured line.
 */
export function recordGatewayEvent(event: GatewayEvent, fields: LogFields = {}): void {
  const previous = state.status
  const heldMs = Date.now() - state.changedAt
  const next = STATUS_FOR[event]

  if (event === 'disconnected') state.disconnects += 1
  if (event === 'resumed') state.resumes += 1

  // Whether this transition ends a stall we already reported — captured before
  // the flag is cleared, so recovery is logged exactly once.
  const recovered = next === 'ready' && state.alarmed

  state.status = next
  state.changedAt = Date.now()
  if (next === 'ready') state.alarmed = false

  logger[LEVEL_FOR[event]](`gateway.${event}`, {
    ...fields,
    previous,
    previousHeldMs: heldMs
  })

  if (recovered) {
    logger.info('gateway.recovered', { after: previous, downMs: heldMs })
  }
}

/**
 * Report a connection stuck off `ready`. Fires once per stall — a five-minute
 * outage should page you once, not every minute until someone looks.
 */
export function checkGatewayHealth(thresholdMs: number = STALL_THRESHOLD_MS): void {
  if (state.status === 'ready' || state.alarmed) return

  const stalledMs = Date.now() - state.changedAt
  if (stalledMs < thresholdMs) return

  state.alarmed = true
  logger.error('gateway.stalled', { status: state.status, stalledMs })
  captureException(
    new Error(`Discord gateway stalled in "${state.status}" for ${Math.round(stalledMs / 1000)}s`),
    { phase: 'gateway.stalled', status: state.status, stalledMs }
  )
}

const watchdogState: { timer: ReturnType<typeof setInterval> | undefined } = {
  timer: undefined
}

export function startGatewayWatchdog(intervalMs: number = WATCHDOG_INTERVAL_MS): void {
  if (watchdogState.timer !== undefined) return
  const timer = setInterval(() => {
    checkGatewayHealth()
  }, intervalMs)
  // Never keep the process alive just to watch a connection.
  if (typeof timer.unref === 'function') {
    timer.unref()
  }
  watchdogState.timer = timer
}

export function stopGatewayWatchdog(): void {
  if (watchdogState.timer === undefined) return
  clearInterval(watchdogState.timer)
  watchdogState.timer = undefined
}

/**
 * Wire discord.js's shard lifecycle to the recorder. Thin on purpose — the
 * state machine above is what carries behaviour, and it is testable without a
 * gateway.
 */
export function registerGatewayLogging(client: Client): void {
  client.on(Events.ShardReady, shardId => {
    recordGatewayEvent('ready', { shardId })
  })

  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    recordGatewayEvent('resumed', { shardId, replayedEvents })
  })

  client.on(Events.ShardReconnecting, shardId => {
    recordGatewayEvent('reconnecting', { shardId })
  })

  client.on(Events.ShardDisconnect, (closeEvent, shardId) => {
    recordGatewayEvent('disconnected', {
      shardId,
      code: closeEvent.code,
      reason: closeEvent.reason
    })
  })

  client.on(Events.ShardError, (error, shardId) => {
    logger.error('gateway.shard_error', { shardId })
    captureException(error, { phase: 'gateway.shard_error', shardId })
  })
}
