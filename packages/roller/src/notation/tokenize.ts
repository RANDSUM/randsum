import { validateNotation } from './validateNotation'

// TokenType kept for backwards compatibility; will be removed when S5/S6 complete
export type TokenType = string

export type ModifierCategory =
  | 'Core'
  | 'Special' // dice types
  | 'Order'
  | 'Clamp'
  | 'Map'
  | 'Filter'
  | 'Substitute'
  | 'Generate'
  | 'Accumulate'
  | 'Scale'
  | 'Reinterpret'
  | 'Dispatch'

export type TokenCategory = ModifierCategory | 'unknown'

export interface Token {
  readonly text: string
  readonly key: string
  readonly category: TokenCategory
  readonly start: number
  readonly end: number
  readonly description: string
}

interface SpecialDieEntry {
  readonly key: string
  readonly category: TokenCategory
  readonly pattern: RegExp
  readonly describe: (text: string) => string
}

// Order matters — draw (DDN) before standard core (NdS), fate (dF) before standard, etc.
const SPECIAL_DIE_PATTERNS: readonly SpecialDieEntry[] = [
  {
    key: 'DDN',
    category: 'Special',
    pattern: /^(\d*)[Dd][Dd](\d+)/,
    describe: t => `Draw die: ${t}`
  },
  {
    key: 'gN',
    category: 'Special',
    pattern: /^(\d*)[Gg](\d+)/,
    describe: t => `Geometric die: ${t}`
  },
  {
    key: 'dF',
    category: 'Special',
    pattern: /^(\d*)[Dd][Ff](?:\.([12]))?/,
    describe: t => `Fate die: ${t}`
  },
  {
    key: 'zN',
    category: 'Special',
    pattern: /^(\d*)[Zz](\d+)/,
    describe: t => `Zero-bias die: ${t}`
  },
  {
    key: 'd{...}',
    category: 'Special',
    pattern: /^(\d*)[Dd]\{([^}]+)\}/,
    describe: t => `Custom faces: ${t}`
  },
  { key: 'd%', category: 'Special', pattern: /^\d*[Dd]%/, describe: () => 'Percentile die (d100)' }
]

interface ModifierEntry {
  readonly key: string
  readonly category: TokenCategory
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
  { key: '//', category: 'Scale', pattern: /^\/\/\d+/ },
  // %N (modulo)
  { key: '%', category: 'Scale', pattern: /^%\d+/ },
  // ** before * to avoid partial match
  { key: '**', category: 'Scale', pattern: /^\*\*\d+/ },
  { key: '*', category: 'Scale', pattern: /^\*\d+/ },
  // !! and !p and !s{} and !i and !r before ! to avoid partial match
  { key: '!!', category: 'Accumulate', pattern: /^!!\d*/ },
  { key: '!p', category: 'Accumulate', pattern: /^!p\d*/i },
  { key: '!s{..}', category: 'Generate', pattern: /^![sS]\{[\d,]+\}/ },
  { key: '!i', category: 'Generate', pattern: /^![iI]/ },
  { key: '!r', category: 'Generate', pattern: /^![rR]/ },
  { key: '!', category: 'Generate', pattern: /^!/ },
  // Drop variants
  { key: 'H', category: 'Filter', pattern: /^[Hh]\d*/ },
  { key: 'L', category: 'Filter', pattern: /^[Ll]\d*/ },
  { key: 'D{..}', category: 'Filter', pattern: /^[Dd]\{[^}]+\}/ },
  // Keep: KM before KL before K to avoid K matching first char of KM/KL
  { key: 'KM', category: 'Filter', pattern: /^[Kk][Mm]\d*/ },
  { key: 'KL', category: 'Filter', pattern: /^[Kk][Ll]\d*/ },
  { key: 'K', category: 'Filter', pattern: /^[Kk]\d*/ },
  // Brace-based modifiers — closing } required; partial input stays unknown
  // ro{} (reroll once) before R{} to avoid R matching first char of ro
  { key: 'ro{..}', category: 'Substitute', pattern: /^[Rr][Oo]\{[^}]+\}/ },
  { key: 'R{..}', category: 'Substitute', pattern: /^[Rr]\{[^}]+\}\d*/ },
  { key: 'C{..}', category: 'Clamp', pattern: /^[Cc]\{[^}]+\}/ },
  { key: 'V{..}', category: 'Map', pattern: /^[Vv]\{[^}]+\}/ },
  { key: 'U', category: 'Substitute', pattern: /^[Uu](?:\{[^}]+\})?/ },
  // Wild Die — must come before margin of success and sort
  { key: 'W', category: 'Dispatch', pattern: /^[Ww](?![{])/ },
  // Count — must come before countSuccesses and sort
  { key: '#{..}', category: 'Reinterpret', pattern: /^#\{[^}]+\}/ },
  // Margin of success — must come before countSuccesses and sort
  { key: 'ms{..}', category: 'Scale', pattern: /^[Mm][Ss]\{\d+\}/ },
  { key: 'S{..}', category: 'Reinterpret', pattern: /^[Ss]\{\d+(?:,\d+)?\}/ },
  { key: 'F{..}', category: 'Reinterpret', pattern: /^[Ff]\{\d+\}/ },
  // Sort — must come after countSuccesses (S{N}) to avoid conflicts
  { key: 'sort', category: 'Order', pattern: /^[Ss](?:[Aa]|[Dd])?(?![{\d])/ },
  // Scale — only meaningful after a core token
  { key: '+', category: 'Scale', pattern: /^\+\d+/ },
  { key: '-', category: 'Scale', pattern: /^-\d+/ },
  // Repeat operator — xN at the end (N >= 1)
  { key: 'xN', category: 'Special', pattern: /^[Xx][1-9]\d*/ },
  // Annotation/label — metadata, does not affect mechanics
  { key: 'label', category: 'Special', pattern: /^\[[^\]]+\]/ }
]

function appendUnknown(tokens: Token[], char: string, cursor: number): void {
  const last = tokens[tokens.length - 1]
  if (last?.category === 'unknown') {
    tokens[tokens.length - 1] = { ...last, text: last.text + char, end: cursor + 1 }
  } else {
    tokens.push({
      text: char,
      key: 'unknown',
      category: 'unknown',
      start: cursor,
      end: cursor + 1,
      description: ''
    })
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
      key: 'xDN',
      category: 'Core',
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
        key: entry.key,
        category: entry.category,
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

  // Check special die patterns before standard NdS core match
  for (const entry of SPECIAL_DIE_PATTERNS) {
    const m = entry.pattern.exec(notation)
    if (m) {
      const text = m[0]
      tokens.push({
        text,
        key: entry.key,
        category: entry.category,
        start: 0,
        end: text.length,
        description: entry.describe(text)
      })
      return parseFrom(notation, text.length, tokens)
    }
  }

  const coreMatch = /^[+-]?\d+[Dd]\d+/.exec(notation)

  if (coreMatch) {
    const text = coreMatch[0]
    tokens.push({
      text,
      key: 'xDN',
      category: 'Core',
      start: 0,
      end: text.length,
      description: describeCoreToken(text)
    })
    return parseFrom(notation, text.length, tokens)
  }

  return parseFrom(notation, 0, tokens)
}
