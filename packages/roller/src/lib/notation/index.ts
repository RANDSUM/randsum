import type {
  RollOptions,
  RollModifiers,
  DropModifier,
  RerollModifier,
  CapModifier,
  ReplaceModifier,
  UniqueModifier,
  Arithmetic
} from '../../types'
import { coreNotationPattern, completeRollPattern } from '../patterns'

/**
 * Parse a dice notation string into RollOptions objects
 * Supports complex notation with multiple dice and modifiers
 * 
 * @param notation - The dice notation string (e.g., "4d6L+3", "1d20-2d6")
 * @returns An array of RollOptions objects
 */
export function notationToOptions(notation: string): RollOptions[] {
  const cleanNotation = notation.replace(/\s/g, '')
  
  // Check if this is multi-dice notation (e.g., "1d20+2d6-1d8")
  const diceMatches = cleanNotation.match(/[+\-]?\d+[dD]\d+[^+\-dD]*/g)
  
  if (diceMatches && diceMatches.length > 1) {
    // Parse multiple dice notations
    return diceMatches.map(match => parseSingleNotation(match.trim()))
  }
  
  // Single dice notation
  return [parseSingleNotation(cleanNotation)]
}

/**
 * Parse a single dice notation string
 */
function parseSingleNotation(notation: string): RollOptions {
  const cleanNotation = notation.replace(/\s/g, '')
  
  // Determine arithmetic operation
  let arithmetic: Arithmetic = 'add'
  let workingNotation = cleanNotation
  
  if (cleanNotation.startsWith('-')) {
    arithmetic = 'subtract'
    workingNotation = cleanNotation.substring(1)
  } else if (cleanNotation.startsWith('+')) {
    workingNotation = cleanNotation.substring(1)
  }
  
  // Extract core dice notation (XdY)
  const coreMatch = workingNotation.match(coreNotationPattern)
  if (!coreMatch) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }
  
  const [quantityStr, sidesStr] = coreMatch[0].toLowerCase().split('d')
  const quantity = Number.parseInt(quantityStr!)
  const sides = Number.parseInt(sidesStr!)
  
  // Extract all components after the core notation
  const modifierPart = workingNotation.substring(coreMatch[0].length)
  const modifiers = parseModifiers(modifierPart)
  
  const options: RollOptions = {
    sides,
    quantity,
    arithmetic
  }
  
  if (Object.keys(modifiers).length > 0) {
    options.modifiers = modifiers
  }
  
  return options
}

/**
 * Parse modifiers from the notation string
 */
function parseModifiers(modifierString: string): RollModifiers {
  const modifiers: RollModifiers = {}
  
  if (!modifierString) {
    return modifiers
  }
  
  // Match all modifier components
  const matches = modifierString.match(completeRollPattern) || []
  
  let rerollMax: number | undefined
  
  for (const match of matches) {
    const upper = match.toUpperCase()
    
    // Drop modifiers
    if (upper.startsWith('L')) {
      if (!modifiers.drop) modifiers.drop = {}
      const countMatch = match.match(/\d+/)
      modifiers.drop.lowest = countMatch ? Number.parseInt(countMatch[0]) : 1
    } else if (upper.startsWith('H')) {
      if (!modifiers.drop) modifiers.drop = {}
      const countMatch = match.match(/\d+/)
      modifiers.drop.highest = countMatch ? Number.parseInt(countMatch[0]) : 1
    } else if (upper.startsWith('D{')) {
      if (!modifiers.drop) modifiers.drop = {}
      Object.assign(modifiers.drop, parseComparisonQuery(match))
    }
    // Cap modifier
    else if (upper.startsWith('C{')) {
      modifiers.cap = parseCapModifier(match)
    }
    // Reroll modifier
    else if (upper.startsWith('R{')) {
      // Check if there's a max modifier after the braces (e.g., R{1,2}3)
      const braceMatch = match.match(/R\{[^}]+\}(\d+)?/i)
      const maxAfterBrace = braceMatch?.[1] ? Number.parseInt(braceMatch[1]) : undefined
      
      const newReroll = parseRerollModifier(match)
      if (maxAfterBrace !== undefined) {
        newReroll.max = maxAfterBrace
      }
      
      if (!modifiers.reroll) {
        modifiers.reroll = newReroll
      } else {
        // Merge with existing reroll
        if (newReroll.exact) {
          modifiers.reroll.exact = [...(modifiers.reroll.exact || []), ...newReroll.exact]
        }
        if (newReroll.lessThan !== undefined) {
          modifiers.reroll.lessThan = newReroll.lessThan
        }
        if (newReroll.greaterThan !== undefined) {
          modifiers.reroll.greaterThan = newReroll.greaterThan
        }
        if (newReroll.max !== undefined) {
          modifiers.reroll.max = newReroll.max
        }
      }
    } else if (upper.startsWith('R') && /R\d+$/i.test(match)) {
      // This is a max modifier for reroll (e.g., R3)
      rerollMax = Number.parseInt(match.substring(1))
    }
    // Replace modifier
    else if (upper.startsWith('V{')) {
      const replaceRules = parseReplaceModifier(match)
      // Always store as array for consistency
      modifiers.replace = replaceRules
    }
    // Unique modifier  
    else if (upper.startsWith('U{')) {
      // If unique is already set, skip (handle duplicate U modifiers)
      if (!modifiers.unique) {
        modifiers.unique = parseUniqueModifier(match)
      }
    } else if (upper === 'U') {
      // Only set if not already set
      if (!modifiers.unique) {
        modifiers.unique = true
      }
    }
    // Explode modifier
    else if (upper === '!') {
      modifiers.explode = true
    }
    // Arithmetic modifiers
    else if (match.startsWith('+')) {
      const value = Number.parseInt(match.substring(1))
      modifiers.plus = (modifiers.plus || 0) + value
    } else if (match.startsWith('-')) {
      const value = Number.parseInt(match.substring(1))
      modifiers.minus = (modifiers.minus || 0) + value
    }
  }
  
  // Apply reroll max if found
  if (rerollMax !== undefined && modifiers.reroll) {
    modifiers.reroll.max = rerollMax
  }
  
  return modifiers
}

/**
 * Parse a comparison query from a modifier string
 * Supports: <X, >X, and exact numbers
 */
function parseComparisonQuery(match: string): Partial<DropModifier> {
  const query: Partial<DropModifier> = {}
  const content = match.match(/\{([^}]+)\}/)?.[1]
  
  if (!content) return query
  
  const parts = content.split(',').map(p => p.trim())
  const exactValues: number[] = []
  
  for (const part of parts) {
    if (part.startsWith('<')) {
      query.lessThan = Number.parseInt(part.substring(1))
    } else if (part.startsWith('>')) {
      query.greaterThan = Number.parseInt(part.substring(1))
    } else if (/^\d+$/.test(part)) {
      exactValues.push(Number.parseInt(part))
    }
  }
  
  if (exactValues.length > 0) {
    query.exact = exactValues
  }
  
  return query
}

/**
 * Parse a cap modifier
 */
function parseCapModifier(match: string): CapModifier {
  const cap: CapModifier = {}
  const content = match.match(/\{([^}]+)\}/)?.[1]
  
  if (!content) return cap
  
  const parts = content.split(',').map(p => p.trim())
  
  for (const part of parts) {
    if (part.startsWith('<')) {
      cap.lessThan = Number.parseInt(part.substring(1))
    } else if (part.startsWith('>')) {
      cap.greaterThan = Number.parseInt(part.substring(1))
    }
  }
  
  return cap
}

/**
 * Parse a reroll modifier
 */
function parseRerollModifier(match: string): RerollModifier {
  const reroll: RerollModifier = {}
  const content = match.match(/\{([^}]+)\}/)?.[1]
  
  if (!content) return reroll
  
  const parts = content.split(',').map(p => p.trim())
  const exactValues: number[] = []
  
  for (const part of parts) {
    if (part.startsWith('<')) {
      reroll.lessThan = Number.parseInt(part.substring(1))
    } else if (part.startsWith('>')) {
      reroll.greaterThan = Number.parseInt(part.substring(1))
    } else if (/^\d+$/.test(part)) {
      exactValues.push(Number.parseInt(part))
    }
  }
  
  if (exactValues.length > 0) {
    reroll.exact = exactValues
  }
  
  return reroll
}

/**
 * Parse a replace modifier
 * Supports patterns like V{1=6}, V{>5=10}, V{1=2,>3=4}
 */
function parseReplaceModifier(match: string): ReplaceModifier[] {
  const rules: ReplaceModifier[] = []
  const content = match.match(/\{([^}]+)\}/)?.[1]
  
  if (!content) return rules
  
  // Split by comma, but handle replacements
  const replacements = content.split(',').map(p => p.trim())
  
  for (const replacement of replacements) {
    const [fromStr, toStr] = replacement.split('=').map(s => s.trim())
    if (!fromStr || !toStr) continue
    
    const to = Number.parseInt(toStr)
    
    if (fromStr.startsWith('<')) {
      rules.push({
        from: { lessThan: Number.parseInt(fromStr.substring(1)) },
        to
      })
    } else if (fromStr.startsWith('>')) {
      rules.push({
        from: { greaterThan: Number.parseInt(fromStr.substring(1)) },
        to
      })
    } else {
      rules.push({
        from: Number.parseInt(fromStr),
        to
      })
    }
  }
  
  return rules
}

/**
 * Parse a unique modifier
 */
function parseUniqueModifier(match: string): UniqueModifier {
  const content = match.match(/\{([^}]+)\}/)?.[1]
  
  if (!content) return true
  
  const notUnique = content
    .split(',')
    .map(p => p.trim())
    .filter(p => /^\d+$/.test(p))
    .map(p => Number.parseInt(p))
  
  return { notUnique }
}

