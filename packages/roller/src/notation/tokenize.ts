import { parseNotation } from './lexer/parse'
import type { PoolKind, TokenCategory } from './lexer/specs'
import { scan } from './lexer/scan'
import { poolToOptions } from './parse/poolToOptions'
import { optionsToDescription } from './transformers/optionsToDescription'

export type { ModifierCategory, TokenCategory } from './lexer/specs'

export interface Token {
  readonly text: string
  readonly key: string
  readonly category: TokenCategory
  readonly start: number
  readonly end: number
  readonly description: string
}

/**
 * Describe a single-pool notation string, returning its description lines (or
 * null if the string does not parse). Token descriptions are always a lone
 * standard pool (`describeCoreToken` strips the sign; `describeModifierToken`
 * prefixes `1d6`), so this describes the first parsed pool directly and avoids
 * pulling notationToOptions / optionsToNotation into the tokenize bundle.
 */
function describeParsed(text: string): string[] | null {
  const parsed = parseNotation(text)
  const pool = parsed.pools[0]
  if (!parsed.valid || pool === undefined) return null
  return optionsToDescription(poolToOptions(pool))
}

function describeCoreToken(text: string): string {
  const stripped = text.replace(/^[+-]/, '')
  const lines = describeParsed(stripped)
  if (lines) return lines[0] ?? text
  const match = /^(\d+)[Dd](\d+)/.exec(stripped)
  if (!match) return text
  const qty = parseInt(match[1] ?? '1', 10)
  const sides = match[2] ?? '?'
  return `Roll ${qty} ${sides}-sided ${qty === 1 ? 'die' : 'dice'}`
}

function describeModifierToken(tokenText: string): string {
  const lines = describeParsed(`1d6${tokenText}`)
  if (!lines) return tokenText
  const modifierDescriptions = lines.slice(1) // skip "Roll 1 6-sided die"
  return modifierDescriptions.join(', ') || tokenText
}

function describeSpecialPool(kind: PoolKind, text: string): string {
  const body = text.replace(/^[+-]/, '')
  switch (kind) {
    case 'draw':
      return `Draw die: ${body}`
    case 'geometric':
      return `Geometric die: ${body}`
    case 'fate':
      return `Fate die: ${body}`
    case 'zeroBias':
      return `Zero-bias die: ${body}`
    case 'custom':
      return `Custom faces: ${body}`
    case 'percentile':
      return 'Percentile die (d100)'
    default:
      return describeCoreToken(text)
  }
}

function describeToken(role: string, poolKind: PoolKind | undefined, text: string): string {
  if (role === 'pool') {
    return poolKind === 'standard'
      ? describeCoreToken(text)
      : describeSpecialPool(poolKind ?? 'standard', text)
  }
  if (role === 'unknown') return ''
  return describeModifierToken(text)
}

/**
 * The NOTATION_DOCS key for a lexer token. The lexer keys tokens by the schema
 * that matched them (`drop`, `!s`), which the parser dispatches on; one schema
 * can match several documented forms, so the public key is resolved from the
 * text here and every emitted key has a doc entry.
 */
function docKey(key: string, text: string): string {
  if (key === 'drop') {
    const head = text[0]?.toUpperCase()
    return head === 'D' ? 'D{..}' : head === 'H' ? 'H' : 'L'
  }
  if (key === '!s') {
    return text[1]?.toLowerCase() === 's' ? '!s{..}' : text.slice(0, 2).toLowerCase()
  }
  return key
}

/**
 * Tokenize a notation string into positioned tokens.
 *
 * This is a direct view over the single cursor lexer (`scan`): the lexer produces
 * the positioned token stream, and this function only attaches human-readable
 * descriptions. There is no separate pattern table here anymore.
 */
export function tokenize(notation: string): readonly Token[] {
  return scan(notation).map(t => ({
    text: t.text,
    key: docKey(t.key, t.text),
    category: t.category,
    start: t.start,
    end: t.end,
    description: describeToken(t.role, t.poolKind, t.text)
  }))
}
