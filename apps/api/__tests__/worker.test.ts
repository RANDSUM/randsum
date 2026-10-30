import { describe, expect, test } from 'bun:test'
import worker from '../src/index'
import type { Env } from '../src/index'

const BASE = 'https://api.randsum.dev'

function call(path: string, init: RequestInit = {}, env: Env = {}): Promise<Response> {
  return worker.fetch(new Request(`${BASE}${path}`, init), env)
}

function mcp(body: unknown): Promise<Response> {
  return call('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream'
    },
    body: JSON.stringify(body)
  })
}

describe('worker', () => {
  test('the root redirects to /v1', async () => {
    const response = await call('/')
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(`${BASE}/v1`)
  })

  test('every response is CORS-enabled and rolls are never cached', async () => {
    const response = await call('/v1/roll?notation=1d20')
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toMatchObject({ notation: '1d20' })
  })

  test('answers a preflight without touching a route', async () => {
    const response = await call('/mcp', { method: 'OPTIONS' })
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Mcp-Protocol-Version')
  })

  test('reads a JSON body on POST', async () => {
    const response = await call('/v1/games/blades/roll', {
      method: 'POST',
      body: JSON.stringify({ rating: 2 })
    })
    expect(await response.json()).toMatchObject({ game: 'blades' })
  })

  test('refuses bodies that are not JSON objects, or are too large', async () => {
    const notJson = await call('/v1/roll', { method: 'POST', body: 'notation=4d6' })
    expect(notJson.status).toBe(400)
    const array = await call('/v1/roll', { method: 'POST', body: '["4d6"]' })
    expect(array.status).toBe(400)
    const huge = await call('/v1/roll', { method: 'POST', body: 'x'.repeat(5000) })
    expect(huge.status).toBe(413)
  })

  test('paths outside /v1 and /mcp are JSON 404s', async () => {
    const response = await call('/v2/roll')
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ see: `${BASE}/v1` })
  })

  test('a limited client gets a 429 with Retry-After', async () => {
    const keys: string[] = []
    const env: Env = {
      RATE_LIMITER: {
        limit: ({ key }) => {
          keys.push(key)
          return Promise.resolve({ success: false })
        }
      }
    }
    const response = await call('/v1', { headers: { 'CF-Connecting-IP': '203.0.113.9' } }, env)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(keys).toEqual(['203.0.113.9'])
  })
})

describe('/mcp', () => {
  test('initializes without a session', async () => {
    const response = await mcp({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.0' }
      }
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Mcp-Session-Id')).toBeNull()
    expect(await response.json()).toMatchObject({
      result: { serverInfo: { name: '@randsum/mcp' } }
    })
  })

  test('lists and calls the same tools as the stdio server', async () => {
    const list = await mcp({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    const { result } = (await list.json()) as {
      readonly result: { readonly tools: readonly { readonly name: string }[] }
    }
    expect(result.tools.map(tool => tool.name).sort()).toEqual(['roll', 'roll_game', 'validate'])

    const rolled = await mcp({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'roll', arguments: { notation: '3d6', seed: 7 } }
    })
    expect(await rolled.json()).toMatchObject({
      result: { structuredContent: { notation: '3d6' } }
    })
  })

  test('GET is refused: there is no stream to open', async () => {
    const response = await call('/mcp')
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
