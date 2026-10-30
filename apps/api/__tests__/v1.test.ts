import { describe, expect, test } from 'bun:test'
import { AVAILABLE_GAMES } from '@randsum/games'
import { handleV1 } from '../src/v1'

const origin = 'https://api.randsum.dev'

function get(path: string, input: Record<string, unknown> = {}): ReturnType<typeof handleV1> {
  return handleV1({ method: 'GET', path, input, origin })
}

function post(path: string, input: Record<string, unknown>): ReturnType<typeof handleV1> {
  return handleV1({ method: 'POST', path, input, origin })
}

describe('/v1', () => {
  test('lists every endpoint, cacheably', () => {
    const result = get('/v1')
    expect(result.status).toBe(200)
    expect(result.cacheable).toBe(true)
    expect(result.body).toMatchObject({ version: 'v1', mcp: `${origin}/mcp` })
  })

  test('unknown routes and methods are 404s', () => {
    expect(get('/v1/nope').status).toBe(404)
    expect(post('/v1/games', {}).status).toBe(404)
    expect(post('/v1/random', {}).status).toBe(404)
  })
})

describe('/v1/roll', () => {
  test('rolls notation from a query or a body', () => {
    expect(get('/v1/roll', { notation: '4d6L' })).toMatchObject({
      status: 200,
      body: { notation: '4d6L', pools: [{ notation: '4d6L' }] }
    })
    expect(post('/v1/roll', { notation: '2d20H+5' }).status).toBe(200)
  })

  test('a seed makes the roll reproducible, from a numeral or a number', () => {
    const a = get('/v1/roll', { notation: '10d6', seed: '42' })
    const b = post('/v1/roll', { notation: '10d6', seed: 42 })
    expect(a.status).toBe(200)
    expect(a.body).toEqual(b.body)
  })

  test('bad input is a 400 with a reason', () => {
    expect(get('/v1/roll').status).toBe(400)
    expect(get('/v1/roll', { notation: 'x'.repeat(1001) }).status).toBe(400)
    expect(get('/v1/roll', { notation: '4d6', seed: '1.5' })).toMatchObject({
      status: 400,
      body: { error: '"seed" must be an integer.' }
    })
    const invalid = get('/v1/roll', { notation: '4d' })
    expect(invalid.status).toBe(400)
    expect(invalid.body).toHaveProperty('error')
  })
})

describe('long form', () => {
  test('matches the short form: same notation, same seeded dice', () => {
    const short = get('/v1/roll', { notation: '4d6L+3', seed: '9' })
    const dotted = get('/v1/roll', {
      sides: '6',
      quantity: '4',
      'modifiers.drop.lowest': '1',
      'modifiers.plus': '3',
      seed: '9'
    })
    const bracketed = get('/v1/roll', {
      sides: '6',
      quantity: '4',
      'modifiers[drop][lowest]': '1',
      'modifiers[plus]': '3',
      seed: '9'
    })
    const nested = post('/v1/roll', {
      sides: 6,
      quantity: 4,
      modifiers: { drop: { lowest: 1 }, plus: 3 },
      seed: 9
    })
    expect(short.status).toBe(200)
    expect(dotted.body).toEqual(short.body)
    expect(bracketed.body).toEqual(short.body)
    expect(nested.body).toEqual(short.body)
  })

  test('reads JSON values out of query strings', () => {
    expect(
      get('/v1/roll', { sides: '6', quantity: '3', 'modifiers.reroll.exact': '[1,2]' })
    ).toMatchObject({ status: 200, body: { notation: '3d6R{1,2}' } })
  })

  test('validate answers in both forms', () => {
    expect(get('/v1/validate', { notation: '4d6L' }).body).toMatchObject({
      valid: true,
      options: [{ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }]
    })
    expect(
      get('/v1/validate', { sides: '6', quantity: '4', 'modifiers.drop.lowest': '1' }).body
    ).toMatchObject({ notation: '4d6L', valid: true })
  })

  test('refuses unknown modifiers, missing sides, and mixing forms', () => {
    expect(get('/v1/roll', { sides: '6', 'modifiers.bogus': '1' })).toMatchObject({
      status: 400,
      body: { error: 'Unknown or unusable modifier "bogus".' }
    })
    expect(get('/v1/roll', { quantity: '4' }).status).toBe(400)
    expect(get('/v1/roll', { sides: 'banana' }).status).toBe(400)
    expect(get('/v1/roll', { notation: '1d6', sides: '6' }).status).toBe(400)
  })
})

describe('/v1/validate', () => {
  test('describes valid notation and explains invalid notation', () => {
    expect(get('/v1/validate', { notation: '4d6L' }).body).toMatchObject({ valid: true })
    const invalid = get('/v1/validate', { notation: '4d' })
    expect(invalid.status).toBe(200)
    expect(invalid.body).toMatchObject({ valid: false })
    expect(invalid.body).toHaveProperty('error')
  })
})

describe('/v1/random', () => {
  test('defaults to one integer from 1 to 100', () => {
    const result = get('/v1/random')
    expect(result.status).toBe(200)
    expect(result.cacheable).toBeUndefined()
    const body = result.body as { readonly values: readonly number[] }
    expect(body.values).toHaveLength(1)
    expect(body.values[0]).toBeGreaterThanOrEqual(1)
    expect(body.values[0]).toBeLessThanOrEqual(100)
  })

  test('honours min, max and count', () => {
    const fill = (words: Uint32Array): void => {
      words.fill(7)
    }
    const result = handleV1(
      { method: 'GET', path: '/v1/random', input: { min: '10', max: '19', count: '3' }, origin },
      fill
    )
    expect(result.body).toEqual({ min: 10, max: 19, count: 3, values: [17, 17, 17] })
  })

  test('bad bounds are 400s', () => {
    expect(get('/v1/random', { min: 'a' }).status).toBe(400)
    expect(get('/v1/random', { min: '5', max: '1' }).status).toBe(400)
    expect(get('/v1/random', { count: '5000' }).status).toBe(400)
  })
})

describe('/v1/games', () => {
  test('lists every game with its inputs', () => {
    const body = get('/v1/games').body as { readonly games: readonly { readonly game: string }[] }
    expect(body.games.map(g => g.game)).toEqual([...AVAILABLE_GAMES])
  })

  test('rolls a game from query strings, typed by the spec', () => {
    expect(get('/v1/games/blades/roll', { rating: '3' })).toMatchObject({
      status: 200,
      body: { game: 'blades' }
    })
    expect(get('/v1/games/fifth/roll', { modifier: '5', crit: 'true' })).toMatchObject({
      status: 200,
      body: { game: 'fifth' }
    })
  })

  test('rolls a game from a JSON body', () => {
    expect(post('/v1/games/fate/roll', { modifier: 2 })).toMatchObject({
      status: 200,
      body: { game: 'fate' }
    })
  })

  test('names the field that is wrong', () => {
    expect(get('/v1/games/fate/roll', { modifier: '99' }).body).toMatchObject({
      error: '"modifier" must be at most 5.'
    })
    expect(get('/v1/games/fate/roll', { modifier: 'lots' }).body).toMatchObject({
      error: '"modifier" must be an integer.'
    })
    expect(get('/v1/games/fifth/roll', { crit: 'maybe' }).body).toMatchObject({
      error: '"crit" must be a boolean.'
    })
    expect(get('/v1/games/fifth/roll', { rollingWith: 'Sideways' }).body).toMatchObject({
      error: '"rollingWith" must be one of "Advantage", "Disadvantage".'
    })
  })

  test('a required input that is missing is a 400', () => {
    expect(get('/v1/games/pbta/roll')).toMatchObject({
      status: 400,
      body: { error: '"pbta" requires "stat".' }
    })
  })

  test('an unknown game is a 404 that lists the real ones', () => {
    expect(get('/v1/games/chess/roll')).toMatchObject({
      status: 404,
      body: { games: [...AVAILABLE_GAMES] }
    })
  })
})
