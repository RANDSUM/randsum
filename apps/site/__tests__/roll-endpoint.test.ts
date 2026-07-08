import { describe, expect, test } from 'bun:test'
import {
  type RollErrorBody,
  type RollSuccessBody,
  USAGE_PAYLOAD,
  evaluateBody,
  evaluateNotation
} from '../src/pages/api/roll'

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

describe('POST handler', () => {
  test('returns JSON with CORS headers for a valid roll', async () => {
    const { POST } = await import('../src/pages/api/roll')
    const request = new Request('https://randsum.dev/api/roll', {
      method: 'POST',
      body: JSON.stringify({ notation: '1d20' })
    })
    const response = await POST({ request } as Parameters<typeof POST>[0])
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    const json = (await response.json()) as RollSuccessBody
    expect(json.notation).toBe('1d20')
    expect(json.total).toBeGreaterThanOrEqual(1)
    expect(json.total).toBeLessThanOrEqual(20)
  })
})

describe('GET usage payload', () => {
  test('documents the POST contract', () => {
    expect(USAGE_PAYLOAD.endpoint).toBe('/api/roll')
    expect(USAGE_PAYLOAD.method).toBe('POST')
    expect(USAGE_PAYLOAD.response).toHaveProperty('total')
  })
})
