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

const ANNOTATION_MATCHER = /\[[^\]]+\]/y
const REPEAT_MATCHER = /[Xx][1-9]\d*/y

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

function scanFrom(input: string, cursor: number, tokens: LexToken[]): void {
  if (cursor >= input.length) return

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
      scanFrom(input, pool.end, tokens)
      return
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
    scanFrom(input, mod.end, tokens)
    return
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
    scanFrom(input, cursor + repeat.length, tokens)
    return
  }

  const annotation = matchAt(ANNOTATION_MATCHER, input, cursor)
  if (annotation) {
    tokens.push({
      text: annotation,
      key: 'label',
      category: 'Special',
      start: cursor,
      end: cursor + annotation.length,
      role: 'annotation'
    })
    scanFrom(input, cursor + annotation.length, tokens)
    return
  }

  appendUnknown(tokens, input[cursor] ?? '', cursor)
  scanFrom(input, cursor + 1, tokens)
}

/**
 * Pure lexical scan: one left-to-right cursor pass producing positioned tokens.
 * Structure is NOT enforced here (a leading modifier, a pool mid-stream, etc. are
 * tokenized as they lie) — this is the raw stream `tokenize` exposes. Structural
 * validity is layered on top by `parseNotation`.
 */
export function scan(input: string): readonly LexToken[] {
  if (input.length === 0) return []
  const tokens: LexToken[] = []
  scanFrom(input, 0, tokens)
  return tokens
}
