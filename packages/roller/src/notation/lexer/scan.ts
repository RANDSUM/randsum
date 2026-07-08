import type { PoolKind, TokenCategory } from './specs'
import { MODIFIER_SPECS, POOL_SPECS } from './specs'

/** A positioned lexical token. Roles above `unknown` tile the notation string. */
export interface LexToken {
  readonly text: string
  readonly key: string
  readonly category: TokenCategory
  readonly start: number
  readonly end: number
  readonly role: 'pool' | 'modifier' | 'annotation' | 'repeat' | 'unknown'
  /** Present when role === 'pool'. */
  readonly poolKind?: PoolKind
  /** Leading arithmetic sign for a pool ('' for the first / unsigned pool). */
  readonly sign?: '+' | '-' | ''
}

interface PoolMatch {
  readonly text: string // includes any leading sign
  readonly key: string
  readonly kind: PoolKind
  readonly sign: '+' | '-' | ''
  readonly end: number
}

/**
 * Try to read a die-pool head at `pos`. A pool is only valid at a boundary: the
 * start of the string (`isStart`), or after a `+`/`-` sign that introduces an
 * additional pool. Special dice are probed before the standard NdS form.
 */
function scanPoolAt(input: string, pos: number, isStart: boolean): PoolMatch | null {
  const first = input[pos]
  const signed = first === '+' || first === '-'
  if (!signed && !isStart) return null
  const sign: '+' | '-' | '' = signed ? first : ''
  const bodyStart = signed ? pos + 1 : pos

  for (const spec of POOL_SPECS) {
    spec.matcher.lastIndex = bodyStart
    const m = spec.matcher.exec(input)
    if (m?.index === bodyStart) {
      const end = spec.matcher.lastIndex
      return { text: input.slice(pos, end), key: spec.key, kind: spec.kind, sign, end }
    }
  }
  return null
}

interface ModifierMatch {
  readonly text: string
  readonly key: string
  readonly category: TokenCategory
  readonly end: number
}

function scanModifierAt(input: string, pos: number): ModifierMatch | null {
  for (const spec of MODIFIER_SPECS) {
    spec.matcher.lastIndex = pos
    const m = spec.matcher.exec(input)
    if (m?.index === pos) {
      return { text: m[0], key: spec.key, category: spec.category, end: spec.matcher.lastIndex }
    }
  }
  return null
}

const REPEAT_MATCHER = /[Xx][1-9]\d*/y

/**
 * Memo for annotation scanning: once no ']' exists at or beyond a position,
 * none exists at any later position either, so failed searches never repeat.
 */
interface AnnotationScanState {
  noCloseBracketFrom: number
}

/**
 * Linear-time annotation matcher, replacing the sticky regex /\[[^\]]+\]/y.
 * That regex cost O(remaining) per failed attempt (greedy [^\]]+ run plus
 * backtrack), which an all-'[' input turned into O(n^2) across the scan — a
 * real DoS on the unguarded tokenize subpath (CodeQL js/polynomial-redos).
 * indexOf is linear per call and the memo bounds total search work to one
 * pass, keeping the whole scan O(n). Semantics are identical: the first ']'
 * closes the annotation, and at least one content character is required.
 */
function matchAnnotationAt(input: string, pos: number, state: AnnotationScanState): string | null {
  if (input.charCodeAt(pos) !== 91 /* '[' */) return null
  if (pos >= state.noCloseBracketFrom) return null
  const close = input.indexOf(']', pos + 1)
  if (close === -1) {
    state.noCloseBracketFrom = pos
    return null
  }
  if (close === pos + 1) return null
  return input.slice(pos, close + 1)
}

function matchAt(matcher: RegExp, input: string, pos: number): string | null {
  matcher.lastIndex = pos
  const m = matcher.exec(input)
  return m?.index === pos ? m[0] : null
}

function appendUnknown(tokens: LexToken[], char: string, cursor: number): void {
  const last = tokens[tokens.length - 1]
  if (last?.role === 'unknown') {
    tokens[tokens.length - 1] = { ...last, text: last.text + char, end: cursor + 1 }
  } else {
    tokens.push({
      text: char,
      key: 'unknown',
      category: 'unknown',
      start: cursor,
      end: cursor + 1,
      role: 'unknown'
    })
  }
}

/**
 * Advance the cursor by exactly one token, pushing it onto `tokens`, and return
 * the new cursor. Every branch consumes at least one character, so the driving
 * loop in `scan` is guaranteed to terminate. This is an ordinary function (not a
 * recursion) precisely so that pathological input — a very long unmatched run, or
 * a very long valid stream — costs stack space O(1) rather than O(length).
 */
function scanStep(
  input: string,
  cursor: number,
  tokens: LexToken[],
  annotationState: AnnotationScanState
): number {
  const isStart = cursor === 0
  const nextIsSign = input[cursor] === '+' || input[cursor] === '-'
  if (isStart || nextIsSign) {
    const pool = scanPoolAt(input, cursor, isStart)
    if (pool) {
      tokens.push({
        text: pool.text,
        key: pool.kind === 'standard' ? 'xDN' : pool.key,
        category: pool.kind === 'standard' ? 'Core' : 'Special',
        start: cursor,
        end: pool.end,
        role: 'pool',
        poolKind: pool.kind,
        sign: pool.sign
      })
      return pool.end
    }
  }

  const mod = scanModifierAt(input, cursor)
  if (mod) {
    tokens.push({
      text: mod.text,
      key: mod.key,
      category: mod.category,
      start: cursor,
      end: mod.end,
      role: 'modifier'
    })
    return mod.end
  }

  const repeat = matchAt(REPEAT_MATCHER, input, cursor)
  if (repeat) {
    tokens.push({
      text: repeat,
      key: 'xN',
      category: 'Special',
      start: cursor,
      end: cursor + repeat.length,
      role: 'repeat'
    })
    return cursor + repeat.length
  }

  const annotation = matchAnnotationAt(input, cursor, annotationState)
  if (annotation) {
    tokens.push({
      text: annotation,
      key: 'label',
      category: 'Special',
      start: cursor,
      end: cursor + annotation.length,
      role: 'annotation'
    })
    return cursor + annotation.length
  }

  appendUnknown(tokens, input[cursor] ?? '', cursor)
  return cursor + 1
}

/**
 * Pure lexical scan: one left-to-right cursor pass producing positioned tokens.
 * Structure is NOT enforced here (a leading modifier, a pool mid-stream, etc. are
 * tokenized as they lie) — this is the raw stream `tokenize` exposes. Structural
 * validity is layered on top by `parseNotation`.
 *
 * The pass is an iterative loop (not per-token/per-char recursion) so that
 * arbitrarily long input — the `tokenize` subpath is unguarded by the 1000-char
 * gate — cannot overflow the call stack.
 */
export function scan(input: string): readonly LexToken[] {
  if (input.length === 0) return []
  const tokens: LexToken[] = []
  // Mutable cursor held on a const object (the lint rule bans `let` but allows
  // this); every `scanStep` advances it by at least one character, so the loop
  // terminates in O(length) steps with O(1) stack depth.
  const cursor = { pos: 0 }
  const annotationState: AnnotationScanState = { noCloseBracketFrom: Number.POSITIVE_INFINITY }
  while (cursor.pos < input.length) {
    cursor.pos = scanStep(input, cursor.pos, tokens, annotationState)
  }
  return tokens
}
