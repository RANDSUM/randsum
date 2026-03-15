import { validateNotation } from './validateNotation'

export type TokenType =
  | 'core'
  | 'dropLowest' // L, LN
  | 'dropHighest' // H, HN
  | 'dropCondition' // D{...}
  | 'keepHighest' // K, KN
  | 'keepMiddle' // KM, KMN
  | 'keepLowest' // kl, klN
  | 'reroll' // R{...}, ro{...}
  | 'explode' // !
  | 'compound' // !!
  | 'penetrate' // !p
  | 'explodeSequence' // !s{...}, !i, !r
  | 'cap' // C{...}
  | 'replace' // V{...}
  | 'unique' // U, U{...}
  | 'countSuccesses' // S{...}
  | 'plus' // +N
  | 'minus' // -N
  | 'marginOfSuccess' // ms{N}
  | 'sort' // s, sa, sd
  | 'integerDivide' // //N
  | 'modulo' // %N
  | 'repeat' // xN
  | 'wildDie' // W
  | 'label' // [text]
  | 'multiply' // *N
  | 'multiplyTotal' // **N
  | 'unknown'

export interface Token {
  readonly text: string
  readonly type: TokenType
  readonly start: number
  readonly end: number
  readonly description: string
}

interface ModifierEntry {
  readonly type: Exclude<TokenType, 'core' | 'unknown'>
  readonly pattern: RegExp
}

function describeCoreToken(text: string): string {
  const stripped = text.replace(/^[+-]/, '')
  const result = validateNotation(stripped)
  if (result.valid) return result.description[0]?.[0] ?? text
  const match = /^(\d+)[Dd](\d+)/.exec(stripped)
  if (!match) return text
  const qty = parseInt(match[1] ?? '1', 10)
  const sides = match[2] ?? '?'
  return `Roll ${qty} ${sides}-sided ${qty === 1 ? 'die' : 'dice'}`
}

function describeModifierToken(tokenText: string): string {
  const result = validateNotation(`1d6${tokenText}`)
  if (!result.valid) return tokenText
  const descriptions = result.description[0] ?? []
  const modifierDescriptions = descriptions.slice(1) // skip "Roll 1 6-sided die"
  return modifierDescriptions.join(', ') || tokenText
}

// Order matters — more specific patterns must come before ambiguous ones
const MODIFIERS: readonly ModifierEntry[] = [
  // // before other patterns to avoid partial match
  { type: 'integerDivide', pattern: /^\/\/\d+/ },
  // %N (modulo)
  { type: 'modulo', pattern: /^%\d+/ },
  // ** before * to avoid partial match
  { type: 'multiplyTotal', pattern: /^\*\*\d+/ },
  { type: 'multiply', pattern: /^\*\d+/ },
  // !! and !p and !s{} and !i and !r before ! to avoid partial match
  { type: 'compound', pattern: /^!!\d*/ },
  { type: 'penetrate', pattern: /^!p\d*/i },
  { type: 'explodeSequence', pattern: /^![sS]\{[\d,]+\}/ },
  { type: 'explodeSequence', pattern: /^![iI]/ },
  { type: 'explodeSequence', pattern: /^![rR]/ },
  { type: 'explode', pattern: /^!/ },
  // Drop variants
  { type: 'dropHighest', pattern: /^[Hh]\d*/ },
  { type: 'dropLowest', pattern: /^[Ll]\d*/ },
  { type: 'dropCondition', pattern: /^[Dd]\{[^}]+\}/ },
  // Keep: KM before kl before K to avoid K matching first char of KM/kl
  { type: 'keepMiddle', pattern: /^[Kk][Mm]\d*/ },
  { type: 'keepLowest', pattern: /^[Kk][Ll]\d*/ },
  { type: 'keepHighest', pattern: /^[Kk]\d*/ },
  // Brace-based modifiers — closing } required; partial input stays unknown
  // ro{} (reroll once) before R{} to avoid R matching first char of ro
  { type: 'reroll', pattern: /^[Rr][Oo]\{[^}]+\}/ },
  { type: 'reroll', pattern: /^[Rr]\{[^}]+\}\d*/ },
  { type: 'cap', pattern: /^[Cc]\{[^}]+\}/ },
  { type: 'replace', pattern: /^[Vv]\{[^}]+\}/ },
  { type: 'unique', pattern: /^[Uu](?:\{[^}]+\})?/ },
  // Wild Die — must come before margin of success and sort
  { type: 'wildDie', pattern: /^[Ww](?![{])/ },
  // Margin of success — must come before countSuccesses and sort
  { type: 'marginOfSuccess', pattern: /^[Mm][Ss]\{\d+\}/ },
  { type: 'countSuccesses', pattern: /^[Ss]\{\d+(?:,\d+)?\}/ },
  // Sort — must come after countSuccesses (S{N}) to avoid conflicts
  { type: 'sort', pattern: /^[Ss](?:[Aa]|[Dd])?(?![{\d])/ },
  // Arithmetic — only meaningful after a core token
  { type: 'plus', pattern: /^\+\d+/ },
  { type: 'minus', pattern: /^-\d+/ },
  // Repeat operator — xN at the end (N >= 1)
  { type: 'repeat', pattern: /^[Xx][1-9]\d*/ },
  // Annotation/label — metadata, does not affect mechanics
  { type: 'label', pattern: /^\[[^\]]+\]/ }
]

function appendUnknown(tokens: Token[], char: string, cursor: number): void {
  const last = tokens[tokens.length - 1]
  if (last?.type === 'unknown') {
    tokens[tokens.length - 1] = { ...last, text: last.text + char, end: cursor + 1 }
  } else {
    tokens.push({ text: char, type: 'unknown', start: cursor, end: cursor + 1, description: '' })
  }
}

function parseFrom(notation: string, cursor: number, tokens: Token[]): readonly Token[] {
  if (cursor >= notation.length) return tokens

  const remaining = notation.slice(cursor)

  // A second dice pool (e.g. +1d20 in "1d6+1d20") must be detected before
  // the plus/minus modifier patterns would consume the leading +/- sign.
  const newPoolMatch = /^[+-]\d+[Dd][1-9]\d*/.exec(remaining)
  if (newPoolMatch) {
    const text = newPoolMatch[0]
    tokens.push({
      text,
      type: 'core',
      start: cursor,
      end: cursor + text.length,
      description: describeCoreToken(text)
    })
    return parseFrom(notation, cursor + text.length, tokens)
  }

  for (const entry of MODIFIERS) {
    const m = remaining.match(entry.pattern)
    if (m) {
      const text = m[0]
      tokens.push({
        text,
        type: entry.type,
        start: cursor,
        end: cursor + text.length,
        description: describeModifierToken(text)
      })
      return parseFrom(notation, cursor + text.length, tokens)
    }
  }

  appendUnknown(tokens, notation[cursor] ?? '', cursor)
  return parseFrom(notation, cursor + 1, tokens)
}

export function tokenize(notation: string): readonly Token[] {
  if (notation.length === 0) return []

  const tokens: Token[] = []
  const coreMatch = /^[+-]?\d+[Dd]\d+/.exec(notation)

  if (coreMatch) {
    const text = coreMatch[0]
    tokens.push({
      text,
      type: 'core',
      start: 0,
      end: text.length,
      description: describeCoreToken(text)
    })
    return parseFrom(notation, text.length, tokens)
  }

  return parseFrom(notation, 0, tokens)
}
