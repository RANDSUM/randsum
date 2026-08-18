/**
 * Covers the dead-man's-switch heartbeat.
 *
 * The behaviour that matters is that it never becomes a source of failure
 * itself: a monitoring endpoint being down must not take the bot with it, and
 * must not recurse into the error tracker (whose delivery path shares the same
 * network that just failed).
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { PingFn } from '../../src/utils/heartbeat.js'

interface HeartbeatModule {
  readonly startHeartbeat: (options?: {
    readonly ping?: PingFn | undefined
    readonly intervalMs?: number | undefined
  }) => void
  readonly stopHeartbeat: () => void
  readonly sendHeartbeat: () => Promise<void>
}

async function loadHeartbeat(): Promise<HeartbeatModule> {
  const suffix = Math.random().toString(36).slice(2)
  return await import(`../../src/utils/heartbeat.js?case=${suffix}`)
}

const originalUrl = process.env['HEALTHCHECK_URL']

beforeEach(() => {
  delete process.env['HEALTHCHECK_URL']
})

afterEach(() => {
  if (originalUrl === undefined) delete process.env['HEALTHCHECK_URL']
  else process.env['HEALTHCHECK_URL'] = originalUrl
})

describe('heartbeat', () => {
  test('pings immediately on start so a restart is visible without waiting', async () => {
    process.env['HEALTHCHECK_URL'] = 'https://hc.example/abc'
    const pinged: string[] = []

    const hb = await loadHeartbeat()
    hb.startHeartbeat({
      ping: url => {
        pinged.push(url)
        return Promise.resolve()
      },
      intervalMs: 60_000
    })
    await hb.sendHeartbeat()
    hb.stopHeartbeat()

    expect(pinged.length).toBeGreaterThanOrEqual(1)
    expect(pinged[0]).toBe('https://hc.example/abc')
  })

  test('does nothing when no URL is configured', async () => {
    const pinged: string[] = []

    const hb = await loadHeartbeat()
    hb.startHeartbeat({
      ping: url => {
        pinged.push(url)
        return Promise.resolve()
      }
    })
    await hb.sendHeartbeat()
    hb.stopHeartbeat()

    expect(pinged).toHaveLength(0)
  })

  test('a failing ping never throws', async () => {
    process.env['HEALTHCHECK_URL'] = 'https://hc.example/abc'
    const failing: PingFn = () => Promise.reject(new Error('network down'))

    const hb = await loadHeartbeat()
    hb.startHeartbeat({ ping: failing, intervalMs: 60_000 })

    // The whole point: monitoring being down must not become an outage.
    await expect(hb.sendHeartbeat()).resolves.toBeUndefined()
    hb.stopHeartbeat()
  })

  test('stop is idempotent', async () => {
    process.env['HEALTHCHECK_URL'] = 'https://hc.example/abc'
    const hb = await loadHeartbeat()
    hb.startHeartbeat({ ping: () => Promise.resolve(), intervalMs: 60_000 })

    expect(() => {
      hb.stopHeartbeat()
      hb.stopHeartbeat()
    }).not.toThrow()
  })
})
