/**
 * In-process command metrics.
 *
 * Tracks per-command invocation and error counts so a baseline error rate can
 * be established and a future symptom-based alert defined. Counters are held in
 * memory (single-instance worker) and periodically flushed to a single
 * structured log line via the logger, which Render's log pipeline can scrape.
 *
 * No external metrics dependency (no prom-client/StatsD) — a counts log line is
 * the agreed baseline per the audit acceptance criteria.
 */
import { logger } from './logger.js'

const invocations = new Map<string, number>()
const errors = new Map<string, number>()

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

export function recordInvocation(command: string): void {
  increment(invocations, command)
}

export function recordError(command: string): void {
  increment(errors, command)
}

export interface MetricsSnapshot {
  readonly invocations: Readonly<Record<string, number>>
  readonly errors: Readonly<Record<string, number>>
  readonly totalInvocations: number
  readonly totalErrors: number
}

function sumValues(counts: Readonly<Record<string, number>>): number {
  return Object.values(counts).reduce((acc, value) => acc + value, 0)
}

export function snapshot(): MetricsSnapshot {
  const invocationCounts = Object.fromEntries(invocations)
  const errorCounts = Object.fromEntries(errors)

  return {
    invocations: invocationCounts,
    errors: errorCounts,
    totalInvocations: sumValues(invocationCounts),
    totalErrors: sumValues(errorCounts)
  }
}

export function flushMetrics(): void {
  const snap = snapshot()
  logger.info('metrics.flush', {
    invocations: snap.invocations,
    errors: snap.errors,
    totalInvocations: snap.totalInvocations,
    totalErrors: snap.totalErrors
  })
}

const FLUSH_INTERVAL_MS = 5 * 60 * 1000

const flushState: { timer: ReturnType<typeof setInterval> | undefined } = {
  timer: undefined
}

export function startMetricsFlush(intervalMs: number = FLUSH_INTERVAL_MS): void {
  if (flushState.timer !== undefined) return
  const timer = setInterval(flushMetrics, intervalMs)
  // Do not keep the event loop alive solely for metrics flushing.
  if (typeof timer.unref === 'function') {
    timer.unref()
  }
  flushState.timer = timer
}

export function stopMetricsFlush(): void {
  if (flushState.timer === undefined) return
  clearInterval(flushState.timer)
  flushState.timer = undefined
}
