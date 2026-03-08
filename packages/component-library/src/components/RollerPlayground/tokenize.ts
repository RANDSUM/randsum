export type TokenType =
  | 'core'
  | 'dropLowest' // L, LN
  | 'dropHighest' // H, HN
  | 'dropCondition' // D{...}
  | 'keepHighest' // K, KN
  | 'keepLowest' // kl, klN
  | 'reroll' // R{...}
  | 'explode' // !
  | 'compound' // !!
  | 'penetrate' // !p
  | 'cap' // C{...}
  | 'replace' // V{...}
  | 'unique' // U, U{...}
  | 'countSuccesses' // S{...}
  | 'plus' // +N
  | 'minus' // -N
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
  readonly describe: (text: string) => string
}

function describeCoreToken(text: string): string {
  const match = /^[+-]?(\d+)[Dd](\d+)/.exec(text)
  if (!match) return text
  const qty = parseInt(match[1] ?? '1', 10)
  const sides = match[2] ?? '?'
  return `Roll ${qty} ${sides}-sided ${qty === 1 ? 'die' : 'dice'}`
}

// Order matters — more specific patterns must come before ambiguous ones
const MODIFIERS: readonly ModifierEntry[] = [
  // ** before * to avoid partial match
  { type: 'multiplyTotal', pattern: /^\*\*\d+/, describe: t => `×${t.slice(2)} total` },
  { type: 'multiply', pattern: /^\*\d+/, describe: t => `×${t.slice(1)}` },
  // !! and !p before ! to avoid partial match
  { type: 'compound', pattern: /^!!\d*/, describe: () => 'Compound' },
  { type: 'penetrate', pattern: /^!p\d*/i, describe: () => 'Penetrate' },
  { type: 'explode', pattern: /^!/, describe: () => 'Explode' },
  // Drop variants
  {
    type: 'dropHighest',
    pattern: /^[Hh]\d*/,
    describe: t => {
      const n = t.slice(1)
      return n ? `Drop highest ${n}` : 'Drop highest'
    }
  },
  {
    type: 'dropLowest',
    pattern: /^[Ll]\d*/,
    describe: t => {
      const n = t.slice(1)
      return n ? `Drop lowest ${n}` : 'Drop lowest'
    }
  },
  { type: 'dropCondition', pattern: /^[Dd]\{[^}]+\}/, describe: t => `Drop ${t.slice(2, -1)}` },
  // Keep: kl before K to avoid K matching first char of kl
  {
    type: 'keepLowest',
    pattern: /^[Kk][Ll]\d*/,
    describe: t => {
      const n = t.slice(2)
      return n ? `Keep lowest ${n}` : 'Keep lowest'
    }
  },
  {
    type: 'keepHighest',
    pattern: /^[Kk]\d*/,
    describe: t => {
      const n = t.slice(1)
      return n ? `Keep highest ${n}` : 'Keep highest'
    }
  },
  // Brace-based modifiers — closing } required; partial input stays unknown
  {
    type: 'reroll',
    pattern: /^[Rr]\{[^}]+\}\d*/,
    describe: t => {
      const inner = /^[Rr]\{([^}]+)\}/.exec(t)?.[1] ?? ''
      return `Reroll ${inner}`
    }
  },
  { type: 'cap', pattern: /^[Cc]\{[^}]+\}/, describe: t => `Cap ${t.slice(2, -1)}` },
  { type: 'replace', pattern: /^[Vv]\{[^}]+\}/, describe: t => `Replace ${t.slice(2, -1)}` },
  {
    type: 'unique',
    pattern: /^[Uu](?:\{[^}]+\})?/,
    describe: t => (t.length > 1 ? `Unique (not ${t.slice(2, -1)})` : 'Unique')
  },
  {
    type: 'countSuccesses',
    pattern: /^[Ss]\{\d+(?:,\d+)?\}/,
    describe: t => `Successes ${t.slice(2, -1)}`
  },
  // Arithmetic — only meaningful after a core token
  { type: 'plus', pattern: /^\+\d+/, describe: t => t },
  { type: 'minus', pattern: /^-\d+/, describe: t => t }
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
        description: entry.describe(text)
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
