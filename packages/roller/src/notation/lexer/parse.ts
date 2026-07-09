import type { LexToken } from './scan'
import type { PoolKind } from './specs'
import { scan } from './scan'

/** Maximum notation length accepted by every public surface (RDN safety limit). */
export const MAX_NOTATION_LENGTH = 1000

/** A single die pool with the modifier tokens that bind to it. */
export interface PoolNode {
  readonly kind: PoolKind
  /** Arithmetic combination with the preceding pool ('' for the first pool). */
  readonly sign: '+' | '-' | ''
  /** Pool head text including any leading sign (e.g. '+2d6', 'dF', '3DD6'). */
  readonly text: string
  /** Pool head text without the leading sign. */
  readonly body: string
  /** Concatenated text of the modifier tokens bound to this pool. */
  readonly modifiersText: string
  /** True when at least one modifier token binds to this pool. */
  readonly hasModifiers: boolean
  /** Annotation label content (without the surrounding brackets), if present. */
  readonly label?: string
}

export interface ParseError {
  readonly message: string
  readonly position: number
}

export interface ParseResult {
  readonly valid: boolean
  readonly pools: readonly PoolNode[]
  readonly error?: ParseError
}

const COUNT_FAMILY_KEYS = new Set(['#{..}', 'S{..}', 'F{..}'])

const LEADING_QUANTITY = /^\d+/
const STANDARD_BODY = /^\d*[Dd]([1-9]\d*)$/

/**
 * True when a pool head satisfies the positive-integer contract. A leading digit
 * run is the quantity and must not start with 0 (rejects `0d6`, `09g6`). Only the
 * standard NdS form additionally constrains sides to a positive integer (rejects
 * `1d0`); the special-die cores historically accepted `g0`/`z0`/`DD0`, so their
 * sides are left to the marker regex to keep acceptance identical.
 */
function poolMagnitudeValid(kind: PoolKind, body: string): boolean {
  const quantity = LEADING_QUANTITY.exec(body)?.[0]
  if (quantity !== undefined && !/^[1-9]/.test(quantity)) return false
  if (kind === 'standard') return STANDARD_BODY.test(body)
  return true
}

function invalid(message: string, position: number): ParseResult {
  return { valid: false, pools: [], error: { message, position } }
}

function buildPool(head: LexToken, bound: readonly LexToken[]): PoolNode {
  const modifierTokens = bound.filter(t => t.role === 'modifier')
  const label = bound.find(t => t.role === 'annotation')?.text.slice(1, -1)
  return {
    kind: head.poolKind ?? 'standard',
    sign: head.sign ?? '',
    text: head.text,
    body: head.text.replace(/^[+-]/, ''),
    modifiersText: modifierTokens.map(t => t.text).join(''),
    hasModifiers: modifierTokens.length > 0,
    ...(label !== undefined ? { label } : {})
  }
}

/**
 * Structural parse of a notation string. Layers grammar rules over the lexer:
 * the string must begin with a pool, every token must be known, magnitudes must
 * be positive integers, and at most one Count-family modifier may appear. The
 * returned AST (pools + bound modifiers) drives notationToOptions and roll.
 *
 * This is the single acceptance authority — `isDiceNotation` is `parse().valid`.
 */
export function parseNotation(input: string): ParseResult {
  // The lexer positions tokens relative to the trimmed string; track the leading
  // whitespace so every reported error offset is in the caller's coordinates.
  const trimOffset = input.length - input.trimStart().length
  const trimmed = input.trim()
  if (trimmed.length === 0) return invalid('Empty notation', 0)
  if (trimmed.length > MAX_NOTATION_LENGTH) {
    return invalid(
      `Notation exceeds ${MAX_NOTATION_LENGTH} characters`,
      MAX_NOTATION_LENGTH + trimOffset
    )
  }

  const tokens = scan(trimmed)

  // Every token must be known.
  const unknown = tokens.find(t => t.role === 'unknown')
  if (unknown) return invalid(`Unexpected "${unknown.text}"`, unknown.start + trimOffset)

  // A die expression must begin with a pool.
  const head = tokens[0]
  if (!head) return invalid('No die expression found', 0)
  if (head.role !== 'pool') {
    return invalid(`Expected a die before "${head.text}"`, head.start + trimOffset)
  }

  // A repeat operator (xN) repeats everything to its left, so it may only appear
  // in a trailing run: any repeat followed by a further pool / modifier /
  // annotation has no well-defined scope. RDN §6.8.3 leaves multi-pool scope
  // unspecified; rather than silently drop a mid-stream `xN` (as `4d6x2+2d8`
  // previously did), reject it with a positioned error. Whole-string-trailing
  // `xN` is accepted and repeats the entire expression.
  const strayRepeat = tokens.find(
    (t, i) => t.role === 'repeat' && tokens.slice(i + 1).some(u => u.role !== 'repeat')
  )
  if (strayRepeat) {
    return invalid(
      `Repeat "${strayRepeat.text}" must be at the end of the notation`,
      strayRepeat.start + trimOffset
    )
  }

  // At most one Count-family modifier (RDN P5).
  const countFamily = tokens.filter(t => t.role === 'modifier' && COUNT_FAMILY_KEYS.has(t.key))
  if (countFamily.length > 1) {
    return invalid(
      'Only one Count-family modifier (#{}, S{}, F{}) is permitted',
      (countFamily[1]?.start ?? 0) + trimOffset
    )
  }

  // Every pool head must satisfy the positive-integer contract.
  const badPool = tokens.find(
    t =>
      t.role === 'pool' &&
      !poolMagnitudeValid(t.poolKind ?? 'standard', t.text.replace(/^[+-]/, ''))
  )
  if (badPool) return invalid(`Invalid die "${badPool.text}"`, badPool.start + trimOffset)

  // Group tokens into pools: each pool token owns the following modifier /
  // annotation tokens until the next pool token. Any trailing `xN` run (the only
  // position `xN` is now accepted) is ignored here and applied by
  // notationToOptions, which strips a whole-string-trailing repeat before parsing.
  const pools = tokens.flatMap((tok, i) => {
    if (tok.role !== 'pool') return []
    const nextOffset = tokens.slice(i + 1).findIndex(t => t.role === 'pool')
    const end = nextOffset === -1 ? tokens.length : i + 1 + nextOffset
    return [buildPool(tok, tokens.slice(i + 1, end))]
  })

  return { valid: true, pools }
}
