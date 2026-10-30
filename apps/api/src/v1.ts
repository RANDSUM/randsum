import { AVAILABLE_GAMES } from '@randsum/games'
import type { GameShortcode } from '@randsum/games'
import type { InputDeclaration } from '@randsum/games/schema'
import {
  GAME_INPUTS,
  isRequiredInput,
  rollGame,
  rollNotation,
  validateNotationInput
} from '@randsum/mcp/remote'
import { RandsumError } from '@randsum/roller/errors'
import { MAX_COUNT, randomIntProblem, randomInts } from './random'
import type { WordSource } from './random'

// The roller rejects notation longer than 1000 characters, so anything past
// that can never roll. Checked before the parser sees it.
const MAX_NOTATION_LENGTH = 1000

/** The outcome of one `/v1` request, before it becomes a Response. */
export interface V1Result {
  readonly status: number
  readonly body: unknown
  /** True when the body is the same for every caller, so it may be cached. */
  readonly cacheable?: boolean
}

/** One `/v1` request, already decoded: query parameters, or a JSON body's fields. */
export interface V1Request {
  readonly method: string
  readonly path: string
  readonly input: Readonly<Record<string, unknown>>
  readonly origin: string
}

const ok = (body: unknown): V1Result => ({ status: 200, body })

const fail = (status: number, error: string, extra: Record<string, unknown> = {}): V1Result => ({
  status,
  body: { error, ...extra }
})

function isGame(value: string): value is GameShortcode {
  return (AVAILABLE_GAMES as readonly string[]).includes(value)
}

/** Routes a decoded `/v1` request. Never throws. */
export function handleV1(request: V1Request, fill?: WordSource): V1Result {
  const { method, path, input, origin } = request
  const segments = path.split('/').filter(segment => segment.length > 0)
  const route = segments.slice(1).join('/')
  const reads = method === 'GET' || method === 'HEAD'

  if (route === '' && reads) return { ...ok(index(origin)), cacheable: true }
  if (route === 'roll' && (reads || method === 'POST')) return roll(input)
  if (route === 'validate' && (reads || method === 'POST')) return validate(input)
  if (route === 'random' && reads) return random(input, fill)
  if (route === 'games' && reads) return { ...ok(games()), cacheable: true }

  const [games_, game, action] = segments.slice(1)
  if (games_ === 'games' && game !== undefined && action === 'roll' && segments.length === 4) {
    if (!isGame(game)) {
      return fail(404, `Unknown game "${game}".`, { games: AVAILABLE_GAMES })
    }
    if (reads || method === 'POST') return gameRoll(game, input)
  }

  return fail(404, `No route for ${method} ${path}.`, { see: `${origin}/v1` })
}

function notationOf(input: Readonly<Record<string, unknown>>): string | V1Result {
  const notation = input['notation']
  if (typeof notation !== 'string' || notation.trim().length === 0) {
    return fail(400, 'Request must include a non-empty "notation" string.')
  }
  if (notation.length > MAX_NOTATION_LENGTH) {
    return fail(400, `Notation exceeds the maximum length of ${MAX_NOTATION_LENGTH} characters.`)
  }
  return notation
}

/** An integer from a JSON number or a query-string numeral; `undefined` when absent. */
function integerOf(value: unknown): number | undefined | null {
  if (value === undefined) return undefined
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof parsed === 'number' && Number.isSafeInteger(parsed) ? parsed : null
}

function roll(input: Readonly<Record<string, unknown>>): V1Result {
  const notation = notationOf(input)
  if (typeof notation !== 'string') return notation
  const seed = integerOf(input['seed'])
  if (seed === null) return fail(400, '"seed" must be an integer.')

  const checked = validateNotationInput({ notation })
  if (!checked.valid) {
    return fail(400, checked.error ?? `Invalid dice notation: "${notation}"`, {
      ...(checked.suggestion === undefined ? {} : { suggestion: checked.suggestion })
    })
  }
  return attempt(() => rollNotation({ notation, seed }))
}

function validate(input: Readonly<Record<string, unknown>>): V1Result {
  const notation = notationOf(input)
  if (typeof notation !== 'string') return notation
  const { valid, description, suggestion, error } = validateNotationInput({ notation })
  return ok({
    notation,
    valid,
    ...(description === undefined ? {} : { description }),
    ...(suggestion === undefined ? {} : { suggestion }),
    ...(error === undefined ? {} : { error })
  })
}

function random(input: Readonly<Record<string, unknown>>, fill?: WordSource): V1Result {
  const read = (key: string, fallback: number): number | null =>
    input[key] === undefined ? fallback : (integerOf(input[key]) ?? null)
  const min = read('min', 1)
  const max = read('max', 100)
  const count = read('count', 1)
  if (min === null || max === null || count === null) {
    return fail(400, '"min", "max" and "count" must be integers.')
  }
  const request = { min, max, count }
  const problem = randomIntProblem(request)
  if (problem !== undefined) return fail(400, problem)
  return ok({ min, max, count, values: randomInts(request, fill) })
}

function games(): unknown {
  return {
    games: AVAILABLE_GAMES.map(game => ({
      game,
      roll: `/v1/games/${game}/roll`,
      inputs: GAME_INPUTS[game]
    }))
  }
}

/**
 * Reads one declared input from a JSON value or a query-string value, checking
 * its type, bounds and enum. Range errors would also come back from the game's
 * own `roll()`, but checking here names the field.
 */
function gameInput(
  name: string,
  decl: InputDeclaration,
  value: unknown
): { readonly value: unknown } | { readonly error: string } {
  const parsed = (() => {
    if (decl.type === 'integer') return integerOf(value)
    if (decl.type === 'boolean') {
      if (typeof value === 'boolean') return value
      if (value === 'true') return true
      if (value === 'false') return false
      return null
    }
    return typeof value === 'string' ? value : null
  })()
  if (parsed === null || parsed === undefined) {
    return { error: `"${name}" must be ${decl.type === 'integer' ? 'an' : 'a'} ${decl.type}.` }
  }
  if (typeof parsed === 'number') {
    if (decl.minimum !== undefined && parsed < decl.minimum) {
      return { error: `"${name}" must be at least ${decl.minimum}.` }
    }
    if (decl.maximum !== undefined && parsed > decl.maximum) {
      return { error: `"${name}" must be at most ${decl.maximum}.` }
    }
  }
  if (decl.enum !== undefined && !decl.enum.includes(parsed)) {
    return {
      error: `"${name}" must be one of ${decl.enum.map(v => JSON.stringify(v)).join(', ')}.`
    }
  }
  return { value: parsed }
}

function gameRoll(game: GameShortcode, input: Readonly<Record<string, unknown>>): V1Result {
  const missing = Object.entries(GAME_INPUTS[game]).find(
    ([name, decl]) => isRequiredInput(decl) && input[name] === undefined
  )
  if (missing !== undefined) {
    return fail(400, `"${game}" requires "${missing[0]}".`, { inputs: GAME_INPUTS[game] })
  }
  const declared = Object.entries(GAME_INPUTS[game]).filter(([name]) => input[name] !== undefined)
  const read = declared.map(([name, decl]) => [name, gameInput(name, decl, input[name])] as const)
  const problem = read.find(([, outcome]) => 'error' in outcome)
  if (problem !== undefined && 'error' in problem[1]) {
    return fail(400, problem[1].error, { inputs: GAME_INPUTS[game] })
  }
  const params = Object.fromEntries(
    read.flatMap(([name, outcome]) => ('value' in outcome ? [[name, outcome.value]] : []))
  )
  return attempt(() => rollGame(game, params))
}

/**
 * Runs a tool handler. A RandsumError is the caller's to fix (notation the
 * parser rejects, a game input the game's own `roll()` refuses), so it is a
 * 400; anything else is ours, a 500.
 */
function attempt(produce: () => unknown): V1Result {
  try {
    return ok(produce())
  } catch (error) {
    if (error instanceof RandsumError) return fail(400, error.message, { code: error.code })
    console.error(error)
    return fail(500, 'Internal error.')
  }
}

function index(origin: string): unknown {
  return {
    name: 'RANDSUM API',
    version: 'v1',
    description:
      'Roll dice in RANDSUM notation, roll for tabletop game systems, and draw random integers. Every endpoint is public, CORS-enabled and needs no key.',
    docs: 'https://randsum.dev/tools/http-api/',
    notation: 'https://randsum.dev/spec/',
    mcp: `${origin}/mcp`,
    endpoints: [
      {
        path: '/v1/roll',
        methods: ['GET', 'POST'],
        description: 'Roll RANDSUM dice notation. Optional integer seed for a reproducible roll.',
        params: { notation: 'string, required', seed: 'integer, optional' },
        example: `${origin}/v1/roll?notation=4d6L`
      },
      {
        path: '/v1/validate',
        methods: ['GET', 'POST'],
        description: 'Check notation without rolling: a description when valid, a fix when not.',
        params: { notation: 'string, required' },
        example: `${origin}/v1/validate?notation=2d20H%2B5`
      },
      {
        path: '/v1/random',
        methods: ['GET'],
        description: `Uniform random integers from min to max inclusive, from a cryptographic source. Up to ${MAX_COUNT} per request.`,
        params: {
          min: 'integer, default 1',
          max: 'integer, default 100',
          count: 'integer, default 1'
        },
        example: `${origin}/v1/random?min=1&max=6&count=3`
      },
      {
        path: '/v1/games',
        methods: ['GET'],
        description: 'Supported game systems and the inputs each one takes.',
        example: `${origin}/v1/games`
      },
      {
        path: '/v1/games/{game}/roll',
        methods: ['GET', 'POST'],
        description: "Roll for a game system, interpreted by that game's rules.",
        params: { '...': 'the inputs /v1/games lists for that game' },
        example: `${origin}/v1/games/blades/roll?rating=3`
      }
    ]
  }
}
