import type { Modifiers, RollOptions } from '../../types'
import { coreNotationPattern } from '../patterns'

export function notationToOptions(notation: string): RollOptions[] {
  const cleanNotation = notation.trim().replace(/\s+/g, '')
  if (!cleanNotation) {
    return []
  }

  const results: RollOptions[] = []
  let currentIndex = 0
  let isNegative = false

  while (currentIndex < cleanNotation.length) {
    // Check for leading + or -
    if (cleanNotation[currentIndex] === '+') {
      isNegative = false
      currentIndex++
      continue
    }
    if (cleanNotation[currentIndex] === '-') {
      isNegative = true
      currentIndex++
      continue
    }

    // Find the next dice notation
    const remaining = cleanNotation.slice(currentIndex)
    const match = remaining.match(coreNotationPattern)
    if (!match) {
      break
    }

    const diceStart = currentIndex + match.index!
    const diceEnd = diceStart + match[0].length

    // Extract the dice part
    const quantity = parseInt(match[1], 10)
    const sides = parseInt(match[2], 10)

    // Parse modifiers after the dice notation
    let modifierEnd = diceEnd
    const modifiers: Modifiers = {}

    // Parse modifiers
    while (modifierEnd < cleanNotation.length) {
      const nextChar = cleanNotation[modifierEnd]

      // Check if we've hit the next dice notation or arithmetic operator
      if (nextChar === '+' || nextChar === '-') {
        const nextDiceMatch = cleanNotation.slice(modifierEnd + 1).match(coreNotationPattern)
        if (nextDiceMatch) {
          break
        }
      }

      // Drop lowest
      if (nextChar === 'L' || nextChar === 'l') {
        modifierEnd++
        const numMatch = cleanNotation.slice(modifierEnd).match(/^(\d+)/)
        const count = numMatch ? parseInt(numMatch[1], 10) : 1
        modifiers.drop = { ...modifiers.drop, lowest: count }
        modifierEnd += numMatch ? numMatch[0].length : 0
        continue
      }

      // Drop highest
      if (nextChar === 'H' || nextChar === 'h') {
        modifierEnd++
        const numMatch = cleanNotation.slice(modifierEnd).match(/^(\d+)/)
        const count = numMatch ? parseInt(numMatch[1], 10) : 1
        modifiers.drop = { ...modifiers.drop, highest: count }
        modifierEnd += numMatch ? numMatch[0].length : 0
        continue
      }

      // Explode
      if (nextChar === '!') {
        modifierEnd++
        modifiers.explode = true
        continue
      }

      // Reroll
      if (nextChar === 'R' || nextChar === 'r') {
        const rerollMatch = cleanNotation.slice(modifierEnd).match(/^R\{([^}]+)\}(\d+)?/i)
        if (rerollMatch) {
          const content = rerollMatch[1]
          const max = rerollMatch[2] ? parseInt(rerollMatch[2], 10) : undefined
          const reroll = parseRerollContent(content)
          if (max !== undefined) {
            reroll.max = max
          }
          modifiers.reroll = reroll
          modifierEnd += rerollMatch[0].length
          continue
        }
      }

      // Cap
      if (nextChar === 'C' || nextChar === 'c') {
        const capMatch = cleanNotation.slice(modifierEnd).match(/^C\{([^}]+)\}/i)
        if (capMatch) {
          modifiers.cap = parseCapContent(capMatch[1])
          modifierEnd += capMatch[0].length
          continue
        }
      }

      // Drop
      if (nextChar === 'D' || nextChar === 'd') {
        const dropMatch = cleanNotation.slice(modifierEnd).match(/^D\{([^}]+)\}/i)
        if (dropMatch) {
          const existingDrop = modifiers.drop || {}
          modifiers.drop = { ...existingDrop, ...parseDropContent(dropMatch[1]) }
          modifierEnd += dropMatch[0].length
          continue
        }
      }

      // Replace
      if (nextChar === 'V' || nextChar === 'v') {
        const replaceMatch = cleanNotation.slice(modifierEnd).match(/^V\{([^}]+)\}/i)
        if (replaceMatch) {
          modifiers.replace = parseReplaceContent(replaceMatch[1])
          modifierEnd += replaceMatch[0].length
          continue
        }
      }

      // Unique
      if (nextChar === 'U' || nextChar === 'u') {
        // Only process if we don't already have a unique modifier
        if (!modifiers.unique) {
          modifierEnd++
          const uniqueMatch = cleanNotation.slice(modifierEnd).match(/^\{([^}]+)\}/)
          if (uniqueMatch) {
            const notUnique = uniqueMatch[1]
              .split(',')
              .map(n => parseInt(n.trim(), 10))
              .filter(n => !isNaN(n))
            modifiers.unique = { notUnique }
            modifierEnd += uniqueMatch[0].length
          } else {
            modifiers.unique = true
          }
        } else {
          // Skip duplicate U
          modifierEnd++
        }
        continue
      }

      // Arithmetic modifiers
      const arithmeticMatch = cleanNotation.slice(modifierEnd).match(/^([+-])(\d+)/)
      if (arithmeticMatch) {
        const sign = arithmeticMatch[1]
        const value = parseInt(arithmeticMatch[2], 10)
        if (sign === '+') {
          modifiers.plus = (modifiers.plus || 0) + value
        } else {
          modifiers.minus = (modifiers.minus || 0) + value
        }
        modifierEnd += arithmeticMatch[0].length
        continue
      }

      // If we can't parse anything, break
      break
    }

    const options: RollOptions = {
      sides,
      quantity,
      modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
      arithmetic: isNegative ? 'subtract' : 'add'
    }

    results.push(options)
    currentIndex = modifierEnd
    isNegative = false
  }

  return results
}

function parseRerollContent(content: string): { exact?: number[]; greaterThan?: number; lessThan?: number } {
  const parts = content.split(',').map(p => p.trim())
  const result: { exact?: number[]; greaterThan?: number; lessThan?: number } = {}

  for (const part of parts) {
    if (part.startsWith('>')) {
      result.greaterThan = parseInt(part.slice(1), 10)
    } else if (part.startsWith('<')) {
      result.lessThan = parseInt(part.slice(1), 10)
    } else {
      const num = parseInt(part, 10)
      if (!isNaN(num)) {
        result.exact = result.exact || []
        result.exact.push(num)
      }
    }
  }

  return result
}

function parseCapContent(content: string): { greaterThan?: number; lessThan?: number } {
  const parts = content.split(',').map(p => p.trim())
  const result: { greaterThan?: number; lessThan?: number } = {}

  for (const part of parts) {
    if (part.startsWith('>')) {
      result.greaterThan = parseInt(part.slice(1), 10)
    } else if (part.startsWith('<')) {
      result.lessThan = parseInt(part.slice(1), 10)
    }
  }

  return result
}

function parseDropContent(content: string): {
  exact?: number[]
  greaterThan?: number
  lessThan?: number
} {
  const parts = content.split(',').map(p => p.trim())
  const result: { exact?: number[]; greaterThan?: number; lessThan?: number } = {}

  for (const part of parts) {
    if (part.startsWith('>')) {
      result.greaterThan = parseInt(part.slice(1), 10)
    } else if (part.startsWith('<')) {
      result.lessThan = parseInt(part.slice(1), 10)
    } else {
      const num = parseInt(part, 10)
      if (!isNaN(num)) {
        result.exact = result.exact || []
        result.exact.push(num)
      }
    }
  }

  return result
}

function parseReplaceContent(content: string): Array<{ from: number | { greaterThan?: number; lessThan?: number }; to: number }> {
  const parts = content.split(',').map(p => p.trim())
  const result: Array<{ from: number | { greaterThan?: number; lessThan?: number }; to: number }> = []

  for (const part of parts) {
    const match = part.match(/^(.+?)=(.+)$/)
    if (match) {
      const fromStr = match[1].trim()
      const to = parseInt(match[2].trim(), 10)

      let from: number | { greaterThan?: number; lessThan?: number }
      if (fromStr.startsWith('>')) {
        from = { greaterThan: parseInt(fromStr.slice(1), 10) }
      } else if (fromStr.startsWith('<')) {
        from = { lessThan: parseInt(fromStr.slice(1), 10) }
      } else {
        from = parseInt(fromStr, 10)
      }

      result.push({ from, to })
    }
  }

  return result
}

