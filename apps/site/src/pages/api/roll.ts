import type { APIRoute } from 'astro'
import { isDiceNotation, roll, suggestNotationFix } from '@randsum/roller'

// Deploy as an on-demand Netlify function rather than a prerendered page.
export const prerender = false

// The roller rejects notation longer than 1000 characters, so anything past
// that can never produce a valid roll — reject it before touching the parser.
const MAX_NOTATION_LENGTH = 1000
// Cap on the buffered request body. This is checked after the body is read, on
// `string.length` (UTF-16 code units, not bytes), so it is a coarse ceiling
// rather than a true wire-size limit — enough to shed obviously oversized
// payloads once buffered. Generous headroom over a 1000-char notation wrapped in
// the tiny JSON envelope.
const MAX_BODY_BYTES = 4096

const CORS_HEADERS: Readonly<Record<string, string>> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export interface RollSuccessBody {
  readonly notation: string
  readonly total: number
  readonly rolls: readonly number[]
  readonly description: string
}

export interface RollErrorBody {
  readonly error: string
  readonly suggestion?: string
}

export interface RollEvaluation {
  readonly status: number
  readonly body: RollSuccessBody | RollErrorBody
}

/**
 * Pure notation → response mapping shared by the POST handler and its tests.
 * Never throws: invalid input becomes a 400 body carrying the roller's own
 * error message plus a `suggestNotationFix` hint when one is available.
 */
export function evaluateNotation(input: unknown): RollEvaluation {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return {
      status: 400,
      body: { error: 'Request must include a non-empty "notation" string.' }
    }
  }

  if (input.length > MAX_NOTATION_LENGTH) {
    return {
      status: 400,
      body: {
        error: `Notation exceeds the maximum length of ${MAX_NOTATION_LENGTH} characters.`
      }
    }
  }

  // `!isDiceNotation` already guarantees the notation is invalid, so there is no
  // "valid" case to branch on here — surface the invalid-notation message directly.
  if (!isDiceNotation(input)) {
    return errorBody(`Invalid dice notation: "${input}"`, suggestNotationFix(input))
  }

  try {
    const result = roll(input)
    const rolls = result.rolls.flatMap(record => record.rolls)
    const description = result.rolls.flatMap(record => record.description).join('; ')
    return {
      status: 200,
      body: {
        notation: input,
        total: result.total,
        rolls,
        description
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return errorBody(message, suggestNotationFix(input))
  }
}

function errorBody(message: string, suggestion: string | undefined): RollEvaluation {
  return {
    status: 400,
    body: suggestion === undefined ? { error: message } : { error: message, suggestion }
  }
}

/**
 * Pure request-body → response mapping shared by the POST handler and its
 * tests. Enforces the early size guard, JSON parsing, and notation extraction
 * before delegating to {@link evaluateNotation}. Never throws.
 */
export function evaluateBody(raw: string): RollEvaluation {
  if (raw.length > MAX_BODY_BYTES) {
    return { status: 413, body: { error: 'Request body is too large.' } }
  }

  const parsed = parseJson(raw)
  if (!parsed.ok) {
    return { status: 400, body: { error: 'Request body must be valid JSON.' } }
  }

  const value = parsed.value
  const notation =
    typeof value === 'object' && value !== null
      ? (value as { notation?: unknown }).notation
      : undefined

  return evaluateNotation(notation)
}

function parseJson(
  raw: string
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    return { ok: false }
  }
}

export const USAGE_PAYLOAD = {
  endpoint: '/api/roll',
  description: 'Roll RANDSUM dice notation. POST JSON to evaluate a roll.',
  method: 'POST',
  request: { notation: 'string — RANDSUM dice notation, e.g. "4d6L"' },
  response: {
    notation: 'string — the notation that was rolled',
    total: 'number — combined total of all rolls',
    rolls: 'array — individual die values after modifiers',
    description: 'string — human-readable description of the roll'
  },
  example:
    'curl -X POST https://randsum.dev/api/roll -H "Content-Type: application/json" -d \'{"notation":"4d6L"}\'',
  notation_reference: 'https://notation.randsum.dev'
} as const

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  })
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS })

export const GET: APIRoute = () => jsonResponse(USAGE_PAYLOAD, 200)

export const POST: APIRoute = async ({ request }) => {
  const { status, body } = evaluateBody(await request.text())
  return jsonResponse(body, status)
}
