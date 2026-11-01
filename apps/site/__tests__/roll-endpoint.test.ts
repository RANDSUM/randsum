import { describe, expect, test } from 'bun:test'
import {
  type RollErrorBody,
  type RollSuccessBody,
  SUCCESSOR_URL,
  USAGE_PAYLOAD,
  evaluateBody,
  evaluateNotation
} from '../worker/roll'
import worker from '../worker/index'

const assets = {
  fetch: (request: Request): Promise<Response> =>
    Promise.resolve(new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }))
}

function call(path: string, init?: RequestInit): Promise<Response> {
  return worker.fetch(new Request(`https://randsum.dev${path}`, init), { ASSETS: assets })
}

describe('evaluateNotation', () => {
  test('rolls valid notation into a 200 result', () => {
    const { status, body } = evaluateNotation('4d6L')
    expect(status).toBe(200)
    const success = body as RollSuccessBody
    expect(success.notation).toBe('4d6L')
    expect(typeof success.total).toBe('number')
    // 4d6 drop lowest keeps 3 dice
    expect(success.rolls).toHaveLength(3)
    expect(typeof success.description).toBe('string')
    expect(success.description.length).toBeGreaterThan(0)
  })

  test('total falls within the achievable range for the notation', () => {
    Array.from({ length: 200 }).forEach(() => {
      const { body } = evaluateNotation('4d6L')
      const success = body as RollSuccessBody
      expect(success.total).toBeGreaterThanOrEqual(3)
      expect(success.total).toBeLessThanOrEqual(18)
    })
  })

  test('rejects a non-string notation with 400', () => {
    const { status, body } = evaluateNotation(42)
    expect(status).toBe(400)
    expect((body as RollErrorBody).error).toContain('notation')
  })

  test('rejects an empty notation with 400', () => {
    expect(evaluateNotation('   ').status).toBe(400)
  })

  test('invalid notation returns the roller error message with a suggestion', () => {
    // `d6` is now valid (bare dN de-aliases to 1d6), so use a trailing-operator
    // typo instead. suggestNotationFix maps '1d6+' -> '1d6'.
    const { status, body } = evaluateNotation('1d6+')
    expect(status).toBe(400)
    const err = body as RollErrorBody
    expect(err.error.length).toBeGreaterThan(0)
    expect(err.suggestion).toBe('1d6')
  })

  test('unfixable invalid notation omits the suggestion field', () => {
    const { status, body } = evaluateNotation('xyz')
    expect(status).toBe(400)
    expect((body as RollErrorBody).suggestion).toBeUndefined()
  })

  test('notation longer than 1000 characters is rejected before parsing', () => {
    const { status, body } = evaluateNotation('1'.repeat(1001))
    expect(status).toBe(400)
    expect((body as RollErrorBody).error).toContain('1000')
  })
})

describe('evaluateBody', () => {
  test('parses a JSON body and rolls the notation', () => {
    const { status, body } = evaluateBody(JSON.stringify({ notation: '2d6' }))
    expect(status).toBe(200)
    expect((body as RollSuccessBody).notation).toBe('2d6')
  })

  test('rejects invalid JSON with 400', () => {
    const { status, body } = evaluateBody('not json')
    expect(status).toBe(400)
    expect((body as RollErrorBody).error).toContain('JSON')
  })

  test('rejects oversized bodies with 413', () => {
    const { status } = evaluateBody(JSON.stringify({ notation: 'x'.repeat(5000) }))
    expect(status).toBe(413)
  })

  test('missing notation field yields a 400', () => {
    const { status } = evaluateBody(JSON.stringify({ foo: 'bar' }))
    expect(status).toBe(400)
  })
})

describe('worker', () => {
  test('POST returns JSON with CORS headers for a valid roll', async () => {
    const response = await call('/api/roll', {
      method: 'POST',
      body: JSON.stringify({ notation: '1d20' })
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    const json = (await response.json()) as RollSuccessBody
    expect(json.notation).toBe('1d20')
    expect(json.total).toBeGreaterThanOrEqual(1)
    expect(json.total).toBeLessThanOrEqual(20)
  })

  test('GET returns the usage payload, with or without a trailing slash', async () => {
    const response = await call('/api/roll/')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(JSON.parse(JSON.stringify(USAGE_PAYLOAD)))
  })

  test('OPTIONS answers the CORS preflight', async () => {
    const response = await call('/api/roll', { method: 'OPTIONS' })
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  test('every response announces the deprecation and its successor', async () => {
    for (const init of [{ method: 'GET' }, { method: 'OPTIONS' }, { method: 'DELETE' }]) {
      const response = await call('/api/roll', init)
      expect(response.headers.get('Deprecation')).toBe('@1793491200')
      expect(response.headers.get('Sunset')).toBe('Mon, 01 Feb 2027 00:00:00 GMT')
      expect(response.headers.get('Link')).toBe(`<${SUCCESSOR_URL}>; rel="successor-version"`)
    }
    expect(USAGE_PAYLOAD.deprecated).toBe(true)
    expect(USAGE_PAYLOAD.successor).toBe(SUCCESSOR_URL)
  })

  test('unsupported methods get a 405', async () => {
    const response = await call('/api/roll', { method: 'DELETE' })
    expect(response.status).toBe(405)
  })

  test('every other path is served from the assets binding', async () => {
    expect(await (await call('/api/other')).text()).toBe('asset:/api/other')
  })
})

describe('GET usage payload', () => {
  test('documents the POST contract', () => {
    expect(USAGE_PAYLOAD.endpoint).toBe('/api/roll')
    expect(USAGE_PAYLOAD.method).toBe('POST')
    expect(USAGE_PAYLOAD.response).toHaveProperty('total')
  })
})
