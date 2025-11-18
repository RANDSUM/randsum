import type {
  CapModifierOptions,
  DropModifierOptions,
  Modifiers,
  ReplaceComparison,
  ReplaceRule,
  RollOptions,
  RerollModifierOptions,
  UniqueModifierOptions
} from '../../types'

import { coreNotationPattern } from '../patterns'

function parseInteger(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) ? undefined : n
}

function parseDrop(segment: string, modifiers: Modifiers): void {
  const drop: DropModifierOptions = modifiers.drop ?? {}
  if (!segment.startsWith('D{')) {
    // Simple L/H forms
    const letter = segment[0]
    const count = parseInteger(segment.slice(1)) ?? 1
    if (letter === 'L') drop.lowest = count
    if (letter === 'H') drop.highest = count
    modifiers.drop = drop
    return
  }

  // Complex drop: D{<2,>5,2,4}
  const body = segment.slice(2, -1)
  const parts = body.split(',').map(p => p.trim()).filter(Boolean)
  const exact: number[] = []
  for (const token of parts) {
    if (token.startsWith('<')) {
      drop.lessThan = parseInteger(token.slice(1))
    } else if (token.startsWith('>')) {
      drop.greaterThan = parseInteger(token.slice(1))
    } else {
      const n = parseInteger(token)
      if (n !== undefined) exact.push(n)
    }
  }
  if (exact.length) drop.exact = exact
  modifiers.drop = drop
}

function parseCap(segment: string, modifiers: Modifiers): void {
  const cap: CapModifierOptions = modifiers.cap ?? {}
  const body = segment.slice(2, -1)
  const parts = body.split(',').map(p => p.trim()).filter(Boolean)
  for (const token of parts) {
    if (token.startsWith('<')) {
      cap.lessThan = parseInteger(token.slice(1))
    } else if (token.startsWith('>')) {
      cap.greaterThan = parseInteger(token.slice(1))
    }
  }
  modifiers.cap = cap
}

function parseReroll(segment: string, modifiers: Modifiers): void {
  // R{5,20,>2,<6}3
  const bodyMatch = segment.match(/^R\{([^}]*)\}(?<max>\d+)?$/)
  if (!bodyMatch) return
  const body = bodyMatch[1] ?? ''
  const maxStr = (bodyMatch as any).groups?.max as string | undefined
  const reroll: RerollModifierOptions = modifiers.reroll ?? {}

  const parts = body.split(',').map(p => p.trim()).filter(Boolean)
  const exact: number[] = []
  for (const token of parts) {
    if (token.startsWith('<')) {
      reroll.lessThan = parseInteger(token.slice(1))
    } else if (token.startsWith('>')) {
      reroll.greaterThan = parseInteger(token.slice(1))
    } else {
      const n = parseInteger(token)
      if (n !== undefined) exact.push(n)
    }
  }
  if (exact.length) reroll.exact = [...(reroll.exact ?? []), ...exact]
  const max = parseInteger(maxStr)
  if (max !== undefined) reroll.max = max
  modifiers.reroll = reroll
}

function parseUnique(segment: string, modifiers: Modifiers): void {
  // U or U{5,6}
  if (segment === 'U') {
    if (modifiers.unique === undefined) {
      modifiers.unique = true
    }
    return
  }
  const body = segment.slice(2, -1)
  const parts = body.split(',').map(p => p.trim()).filter(Boolean)
  const values = parts.map(p => parseInteger(p)).filter(
    (v): v is number => v !== undefined
  )
  const current = modifiers.unique
  if (current === true || current === undefined) {
    modifiers.unique = { notUnique: values }
  } else {
    modifiers.unique = { notUnique: [...current.notUnique, ...values] }
  }
}

function parseReplace(segment: string, modifiers: Modifiers): void {
  const body = segment.slice(2, -1)
  const parts = body.split(',').map(p => p.trim()).filter(Boolean)
  const rules: ReplaceRule[] = []

  for (const token of parts) {
    const [left, right] = token.split('=')
    const to = parseInteger(right)
    if (to === undefined) continue

    if (left.startsWith('<') || left.startsWith('>')) {
      const cmp: ReplaceComparison = {}
      if (left.startsWith('<')) {
        cmp.lessThan = parseInteger(left.slice(1))
      } else if (left.startsWith('>')) {
        cmp.greaterThan = parseInteger(left.slice(1))
      }
      rules.push({ from: cmp, to })
    } else {
      const n = parseInteger(left)
      if (n !== undefined) {
        rules.push({ from: n, to })
      }
    }
  }

  if (!rules.length) return

  const existing = modifiers.replace
  if (!existing) {
    modifiers.replace = rules
  } else if (Array.isArray(existing)) {
    modifiers.replace = [...existing, ...rules]
  } else {
    modifiers.replace = [existing, ...rules]
  }
}

function parseModifiers(rest: string): Modifiers {
  const modifiers: Modifiers = {}
  let idx = 0

  while (idx < rest.length) {
    const ch = rest[idx]!
    if (ch === 'L' || ch === 'H') {
      let j = idx + 1
      while (j < rest.length && /\d/.test(rest[j]!)) j++
      parseDrop(rest.slice(idx, j), modifiers)
      idx = j
      continue
    }
    if (ch === 'D' && rest[idx + 1] === '{') {
      const end = rest.indexOf('}', idx)
      if (end === -1) break
      parseDrop(rest.slice(idx, end + 1), modifiers)
      idx = end + 1
      continue
    }
    if (ch === 'C' && rest[idx + 1] === '{') {
      const end = rest.indexOf('}', idx)
      if (end === -1) break
      parseCap(rest.slice(idx, end + 1), modifiers)
      idx = end + 1
      continue
    }
    if (ch === 'R' && rest[idx + 1] === '{') {
      let end = rest.indexOf('}', idx)
      if (end === -1) break
      // optional trailing number for max
      let j = end + 1
      while (j < rest.length && /\d/.test(rest[j]!)) j++
      parseReroll(rest.slice(idx, j), modifiers)
      idx = j
      continue
    }
    if (ch === 'U') {
      if (rest[idx + 1] === '{') {
        const end = rest.indexOf('}', idx)
        if (end === -1) break
        parseUnique(rest.slice(idx, end + 1), modifiers)
        idx = end + 1
      } else {
        parseUnique('U', modifiers)
        idx++
      }
      continue
    }
    if (ch === 'V' && rest[idx + 1] === '{') {
      const end = rest.indexOf('}', idx)
      if (end === -1) break
      parseReplace(rest.slice(idx, end + 1), modifiers)
      idx = end + 1
      continue
    }
    if (ch === '!') {
      modifiers.explode = true
      idx++
      continue
    }
    if (ch === '+' || ch === '-') {
      let j = idx + 1
      while (j < rest.length && /\d/.test(rest[j]!)) j++
      const value = parseInteger(rest.slice(idx + 1, j)) ?? 0
      if (ch === '+') {
        modifiers.plus = (modifiers.plus ?? 0) + value
      } else {
        modifiers.minus = (modifiers.minus ?? 0) + value
      }
      idx = j
      continue
    }

    // Unrecognised – stop parsing to avoid infinite loop
    idx++
  }

  return modifiers
}

function splitIntoSegments(notation: string): string[] {
  const segments: string[] = []
  let start = 0
  let inBraces = 0

  for (let i = 0; i < notation.length; i++) {
    const ch = notation[i]!
    if (ch === '{') inBraces++
    if (ch === '}') inBraces = Math.max(0, inBraces - 1)

    if ((ch === '+' || ch === '-') && i > start && inBraces === 0) {
      const rest = notation.slice(i + 1)
      if (/^\d+[dD]\d+/.test(rest)) {
        segments.push(notation.slice(start, i))
        start = i
      }
    }
  }

  segments.push(notation.slice(start))
  return segments.filter(Boolean)
}

export function notationToOptions(input: string): RollOptions[] {
  const trimmed = input.trim()
  if (!trimmed) return []

  const normalised = trimmed.replace(/\s+/g, '')

  const segments = splitIntoSegments(normalised)
  const options: RollOptions[] = []

  const processSegment = (segment: string) => {
    if (!segment) return
    const arithmetic: 'add' | 'subtract' =
      segment.startsWith('-') ? 'subtract' : 'add'

    const unsigned = segment.replace(/^[+-]/, '')
    const coreMatch = unsigned.match(coreNotationPattern)
    if (!coreMatch) return
    const core = coreMatch[0]!
    const rest = unsigned.slice(unsigned.indexOf(core) + core.length)

    const [qtyStr, sidesStr] = core.split(/[dD]/)
    const quantity = parseInteger(qtyStr) ?? 1
    const sides = parseInteger(sidesStr) ?? 0

    const modifiers = rest ? parseModifiers(rest) : undefined

    options.push({
      sides,
      quantity,
      modifiers,
      arithmetic
    })
  }

  segments.forEach(processSegment)

  return options
}



