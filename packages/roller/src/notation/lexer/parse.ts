import type { LexToken } from './scan'
import type { PoolKind } from './specs'
import { scan } from './scan'

/** Maximum notation length accepted by every public surface (RDN safety limit). */
const MAX_NOTATION_LENGTH = 1000

/** A single die pool with the modifier tokens that bind to it. */
export interface PoolNode {
  readonly kind: PoolKind
  /** Arithmetic combination with the preceding pool ('' for the first pool). */
  readonly sign: '+' | '-' | ''
  /** Pool head text without the leading sign (e.g. '2d6', 'dF', '3DD6'). */
  readonly body: string
  /** The modifier tokens bound to this pool, in source order. */
  readonly modifiers: readonly LexToken[]
  /** Annotation label content (without the surrounding brackets), if present. */
  readonly label?: string
}

/** A trailing `xN` repeat operator. */
interface RepeatNode {
  readonly count: number
  /** Offset of the `x` in the caller's (untrimmed) string. */
  readonly position: number
}

export interface ParseError {
  readonly message: string
  readonly position: number
}

export interface ParseResult {
  readonly valid: boolean
  readonly pools: readonly PoolNode[]
  /** The trailing repeat run, left to right. */
  readonly repeats: readonly RepeatNode[]
  readonly error?: ParseError
}

const COUNT_FAMILY_KEYS = new Set(['#{..}', 'S{..}', 'F{..}'])

/** Modifier tokens whose repeats sum (`+2+3`, `LL`), so a pool may hold several. */
const SUMMING = /^(?:[+-]\d+|ms\{\d+\}|[LH]\d*)$/i

/** Flags that say the same thing twice (`4d6!L!`), so a repeat loses nothing. */
const FLAG = /^(?:!|!!|!p|!i|!r|W|U|sa|sd)$/i

/**
 * What a modifier token sets, for the once-per-pool rule. `K`, `kl` and `Km` share
 * a token key but set different things; `!s{..}`, `!i` and `!r` all set the
 * explode sequence; `L`, `H` and `D{..}` share `drop`.
 */
function modifierKind(token: LexToken): string {
  if (token.key === 'K') return token.text.replace(/\d+$/, '').toLowerCase()
  if (token.key === 'drop') return token.text.slice(0, 1).toUpperCase()
  return token.key
}

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
  return { valid: false, pools: [], repeats: [], error: { message, position } }
}

function buildPool(head: LexToken, bound: readonly LexToken[]): PoolNode {
  const label = bound.find(t => t.role === 'annotation')?.text.slice(1, -1)
  return {
    kind: head.poolKind ?? 'standard',
    sign: head.sign ?? '',
    body: head.text.replace(/^[+-]/, ''),
    modifiers: bound.filter(t => t.role === 'modifier'),
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

  // Unbraced `!` / `!!` / `!p`, `!s` and W fire on the maximum face, which dF, zN
  // and d{...} dice do not define. A braced `!{>0}` names its own trigger.
  const maxFace = tokens.find(
    (t, i) =>
      (t.key === '!s' || t.key === 'W' || (/^!!?p?$/.test(t.key) && !t.text.includes('{'))) &&
      ['fate', 'zeroBias', 'custom'].includes(
        tokens
          .slice(0, i)
          .reverse()
          .find(u => u.role === 'pool')?.poolKind ?? ''
      )
  )
  if (maxFace) {
    return invalid(
      `"${maxFace.text}" needs a condition on dF, zN and d{...}`,
      maxFace.start + trimOffset
    )
  }

  // A custom-faces die lists at least one face per comma: `d{a,}` has an empty one.
  const emptyFace = tokens.find(
    t =>
      t.role === 'pool' &&
      t.poolKind === 'custom' &&
      (/\{([^}]*)\}/.exec(t.text)?.[1] ?? '').split(',').some(face => face.trim() === '')
  )
  if (emptyFace) {
    return invalid(`"${emptyFace.text}" has an empty face`, emptyFace.start + trimOffset)
  }

  // `!!N{..}` and `!pN{..}` would keep the condition and drop the depth.
  const depthAndCondition = tokens.find(t => /^!(?:!|p)\d+\{/i.test(t.text))
  if (depthAndCondition) {
    return invalid(
      `"${depthAndCondition.text}" takes a depth or a condition, not both`,
      depthAndCondition.start + trimOffset
    )
  }

  // Explode Sequence rolls each listed size, so every size must be a real die.
  const zeroSize = tokens.find(t => t.key === '!s' && /[{,]0+[,}]/.test(t.text))
  if (zeroSize) {
    return invalid(`"${zeroSize.text}" lists a die with no sides`, zeroSize.start + trimOffset)
  }

  // Group tokens into pools: each pool token owns the following modifier /
  // annotation tokens until the next pool token. The trailing `xN` run (the only
  // position `xN` is accepted) is returned separately; notationToOptions applies
  // it to the whole expression.
  const groups = tokens.flatMap((tok, i) => {
    if (tok.role !== 'pool') return []
    const nextOffset = tokens.slice(i + 1).findIndex(t => t.role === 'pool')
    const end = nextOffset === -1 ? tokens.length : i + 1 + nextOffset
    return [{ head: tok, bound: tokens.slice(i + 1, end) }]
  })

  // Within one pool a modifier that sets a value may appear once (RDN §8.3):
  // a second `*3`, `V{..}` or `sd` would otherwise be dropped without a word.
  // Only the summing forms (+N, -N, ms{N}, L, H) may repeat, and a flag may be
  // written twice.
  for (const { bound } of groups) {
    const annotations = bound.filter(t => t.role === 'annotation')
    if (annotations.length > 1) {
      return invalid(
        'A die expression takes one annotation',
        (annotations[1]?.start ?? 0) + trimOffset
      )
    }
    const repeated = bound.find(
      (t, i) =>
        t.role === 'modifier' &&
        !SUMMING.test(t.text) &&
        bound
          .slice(0, i)
          .some(
            u =>
              u.role === 'modifier' &&
              modifierKind(u) === modifierKind(t) &&
              !(FLAG.test(t.text) && u.text.toLowerCase() === t.text.toLowerCase())
          )
    )
    if (repeated) {
      return invalid(
        `"${repeated.text}" repeats a modifier this die expression already has`,
        repeated.start + trimOffset
      )
    }
  }

  const pools = groups.map(({ head: poolHead, bound }) => buildPool(poolHead, bound))
  const repeats = tokens
    .filter(t => t.role === 'repeat')
    .map(t => ({ count: Number(t.text.slice(1)), position: t.start + trimOffset }))

  return { valid: true, pools, repeats }
}
