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
  const trimmed = input.trim()
  if (trimmed.length === 0) return invalid('Empty notation', 0)
  if (trimmed.length > MAX_NOTATION_LENGTH) {
    return invalid(`Notation exceeds ${MAX_NOTATION_LENGTH} characters`, MAX_NOTATION_LENGTH)
  }

  const tokens = scan(trimmed)

  // Every token must be known.
  const unknown = tokens.find(t => t.role === 'unknown')
  if (unknown) return invalid(`Unexpected "${unknown.text}"`, unknown.start)

  // A die expression must begin with a pool.
  const head = tokens[0]
  if (!head) return invalid('No die expression found', 0)
  if (head.role !== 'pool') return invalid(`Expected a die before "${head.text}"`, head.start)

  // At most one Count-family modifier (RDN P5).
  const countFamily = tokens.filter(t => t.role === 'modifier' && COUNT_FAMILY_KEYS.has(t.key))
  if (countFamily.length > 1) {
    return invalid(
      'Only one Count-family modifier (#{}, S{}, F{}) is permitted',
      countFamily[1]?.start ?? 0
    )
  }

  // Every pool head must satisfy the positive-integer contract.
  const badPool = tokens.find(
    t =>
      t.role === 'pool' &&
      !poolMagnitudeValid(t.poolKind ?? 'standard', t.text.replace(/^[+-]/, ''))
  )
  if (badPool) return invalid(`Invalid die "${badPool.text}"`, badPool.start)

  // Group tokens into pools: each pool token owns the following modifier /
  // annotation tokens until the next pool token. (repeat tokens are structurally
  // valid wherever they lex — nested `xN` is legal — and handled in notationToOptions.)
  const pools = tokens.flatMap((tok, i) => {
    if (tok.role !== 'pool') return []
    const nextOffset = tokens.slice(i + 1).findIndex(t => t.role === 'pool')
    const end = nextOffset === -1 ? tokens.length : i + 1 + nextOffset
    return [buildPool(tok, tokens.slice(i + 1, end))]
  })

  return { valid: true, pools }
}
