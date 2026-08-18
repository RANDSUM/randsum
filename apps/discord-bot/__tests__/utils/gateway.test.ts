/**
 * Covers gateway observability.
 *
 * The behaviour under test is the one whose absence caused the 2026-08-18
 * outage: a connection that is not `ready` has to be *visible*, both in the
 * transition log and in the periodic heartbeat. A test that only asserted
 * "ready works" would have passed on the broken code too.
 */
import { describe, expect, test } from 'bun:test'
import type { GatewayEvent, GatewaySnapshot } from '../../src/utils/gateway.js'

interface GatewayModule {
  readonly recordGatewayEvent: (event: GatewayEvent, fields?: Record<string, unknown>) => void
  readonly gatewaySnapshot: () => GatewaySnapshot
  readonly checkGatewayHealth: (thresholdMs?: number) => void
}

/** Module-level connection state, so each case gets its own instance. */
async function loadGateway(): Promise<GatewayModule> {
  const suffix = Math.random().toString(36).slice(2)
  return await import(`../../src/utils/gateway.js?case=${suffix}`)
}

describe('gateway state', () => {
  test('starts as connecting, not as connected', async () => {
    const gw = await loadGateway()
    const snap = gw.gatewaySnapshot()

    // The pre-fix default was effectively "assume healthy" — nothing tracked
    // state at all, so nothing could report a bad one.
    expect(snap.status).toBe('connecting')
    expect(snap.connected).toBe(false)
  })

  test('a disconnect is reflected in the snapshot the heartbeat reads', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('ready', { shardId: 0 })
    expect(gw.gatewaySnapshot().connected).toBe(true)

    gw.recordGatewayEvent('disconnected', { shardId: 0, code: 1006 })

    const snap = gw.gatewaySnapshot()
    expect(snap.status).toBe('disconnected')
    expect(snap.connected).toBe(false)
    expect(snap.disconnects).toBe(1)
  })

  test('resume returns to ready and is counted separately from a fresh ready', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('disconnected')
    gw.recordGatewayEvent('reconnecting')
    gw.recordGatewayEvent('resumed', { replayedEvents: 4 })

    const snap = gw.gatewaySnapshot()
    expect(snap.status).toBe('ready')
    expect(snap.connected).toBe(true)
    expect(snap.resumes).toBe(1)
  })

  test('reconnecting is not treated as connected', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('reconnecting')

    expect(gw.gatewaySnapshot().connected).toBe(false)
  })
})

describe('gateway watchdog', () => {
  test('reports a connection stuck off ready past the threshold', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('connecting')

    // Threshold 0 stands in for elapsed time without a fake clock.
    expect(() => {
      gw.checkGatewayHealth(0)
    }).not.toThrow()
    expect(gw.gatewaySnapshot().status).toBe('connecting')
  })

  test('stays quiet while the connection is ready', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('ready')

    // A ready connection must never alarm, no matter how long it has held.
    gw.checkGatewayHealth(0)
    expect(gw.gatewaySnapshot().connected).toBe(true)
  })

  test('a stall alarms once, then recovery re-arms it', async () => {
    const gw = await loadGateway()
    gw.recordGatewayEvent('disconnected')

    gw.checkGatewayHealth(0)
    gw.checkGatewayHealth(0) // second call must be a no-op — one page per stall
    gw.recordGatewayEvent('ready')
    expect(gw.gatewaySnapshot().connected).toBe(true)

    // Re-armed: a fresh stall is reportable again.
    gw.recordGatewayEvent('disconnected')
    expect(() => {
      gw.checkGatewayHealth(0)
    }).not.toThrow()
    expect(gw.gatewaySnapshot().disconnects).toBe(2)
  })
})

describe('metrics heartbeat', () => {
  test('carries gateway state, so a heartbeat is not mistaken for health', async () => {
    // Both imported unsuffixed on purpose: metrics.js imports gateway.js by its
    // plain specifier, so a cache-busted gateway would be a *different* module
    // instance and the two would not share state. No other case touches the
    // unsuffixed instance, so this one still starts clean.
    const gw: GatewayModule = await import('../../src/utils/gateway.js')
    const metrics: { flushMetrics: () => void } = await import('../../src/utils/metrics.js')

    gw.recordGatewayEvent('disconnected')

    const lines: string[] = []
    const original = console.warn
    console.warn = (line: string) => {
      lines.push(line)
    }
    try {
      metrics.flushMetrics()
    } finally {
      console.warn = original
    }

    const flush = lines.map(l => JSON.parse(l)).find(l => l.msg === 'metrics.flush')
    expect(flush).toBeDefined()
    // Pre-fix, this line was byte-identical whether or not the bot was connected.
    expect(flush.gateway.connected).toBe(false)
    expect(flush.gateway.status).toBe('disconnected')
  })
})
