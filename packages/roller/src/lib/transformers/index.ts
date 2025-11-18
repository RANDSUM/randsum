import type {
  RollOptions,
  RollModifiers,
  DropModifier,
  RerollModifier,
  CapModifier,
  ReplaceModifier,
  UniqueModifier,
  ComparisonQuery
} from '../../types'

/**
 * Convert RollOptions to dice notation string
 * 
 * @param options - The roll options to convert
 * @returns A dice notation string
 */
export function optionsToNotation(options: RollOptions): string {
  let notation = ''
  
  // Handle arithmetic prefix
  if (options.arithmetic === 'subtract') {
    notation += '-'
  }
  
  // Core dice notation
  const sides = Array.isArray(options.sides) ? options.sides.length : options.sides
  const quantity = options.quantity ?? 1
  notation += `${quantity}d${sides}`
  
  // Add modifiers in a specific order
  if (options.modifiers) {
    const modifiers = options.modifiers
    
    // Cap modifier
    if (modifiers.cap) {
      notation += capToNotation(modifiers.cap)
    }
    
    // Drop modifiers
    if (modifiers.drop) {
      notation += dropToNotation(modifiers.drop)
    }
    
    // Replace modifier
    if (modifiers.replace) {
      notation += replaceToNotation(modifiers.replace)
    }
    
    // Reroll modifier
    if (modifiers.reroll) {
      notation += rerollToNotation(modifiers.reroll)
    }
    
    // Explode modifier
    if (modifiers.explode) {
      notation += '!'
    }
    
    // Unique modifier
    if (modifiers.unique) {
      notation += uniqueToNotation(modifiers.unique)
    }
    
    // Arithmetic modifiers
    if (modifiers.plus) {
      if (modifiers.plus < 0) {
        notation += modifiers.plus
      } else {
        notation += `+${modifiers.plus}`
      }
    }
    
    if (modifiers.minus) {
      notation += `-${modifiers.minus}`
    }
  }
  
  return notation
}

/**
 * Convert RollOptions to human-readable description
 * 
 * @param options - The roll options to convert
 * @returns An array of description strings
 */
export function optionsToDescription(options: RollOptions): string[] {
  const description: string[] = []
  
  // Core description
  const sides = Array.isArray(options.sides) ? options.sides : options.sides
  const quantity = options.quantity ?? 1
  
  if (Array.isArray(options.sides)) {
    // Custom faces
    description.push(
      `Roll ${quantity} Dice with the following sides: ${options.sides.join(', ')}`
    )
  } else {
    // Numeric dice
    const dieWord = quantity === 1 ? 'die' : 'dice'
    description.push(`Roll ${quantity} ${sides}-sided ${dieWord}`)
  }
  
  // Add modifier descriptions
  if (options.modifiers) {
    const modifiers = options.modifiers
    
    // Cap modifier
    if (modifiers.cap) {
      description.push(...capToDescription(modifiers.cap))
    }
    
    // Drop modifiers
    if (modifiers.drop) {
      description.push(...dropToDescription(modifiers.drop))
    }
    
    // Replace modifier
    if (modifiers.replace) {
      description.push(...replaceToDescription(modifiers.replace))
    }
    
    // Reroll modifier
    if (modifiers.reroll) {
      description.push(...rerollToDescription(modifiers.reroll))
    }
    
    // Explode modifier
    if (modifiers.explode) {
      description.push('Exploding Dice')
    }
    
    // Unique modifier
    if (modifiers.unique) {
      description.push(...uniqueToDescription(modifiers.unique))
    }
    
    // Arithmetic modifiers
    if (modifiers.plus) {
      description.push(`Add ${modifiers.plus}`)
    }
    
    if (modifiers.minus) {
      description.push(`Subtract ${modifiers.minus}`)
    }
  }
  
  // Handle arithmetic (subtract)
  if (options.arithmetic === 'subtract') {
    description.push('and Subtract the result')
  }
  
  return description
}

// Helper functions for notation conversion

function capToNotation(cap: CapModifier): string {
  const parts: string[] = []
  
  if (cap.greaterThan !== undefined) {
    parts.push(`>${cap.greaterThan}`)
  }
  
  if (cap.lessThan !== undefined) {
    parts.push(`<${cap.lessThan}`)
  }
  
  return parts.length > 0 ? `C{${parts.join(',')}}` : ''
}

function dropToNotation(drop: DropModifier): string {
  let notation = ''
  
  if (drop.highest !== undefined) {
    notation += drop.highest === 1 ? 'H' : `H${drop.highest}`
  }
  
  if (drop.lowest !== undefined) {
    notation += drop.lowest === 1 ? 'L' : `L${drop.lowest}`
  }
  
  const queryParts: string[] = []
  
  if (drop.greaterThan !== undefined) {
    queryParts.push(`>${drop.greaterThan}`)
  }
  
  if (drop.lessThan !== undefined) {
    queryParts.push(`<${drop.lessThan}`)
  }
  
  if (drop.exact && drop.exact.length > 0) {
    queryParts.push(...drop.exact.map(String))
  }
  
  if (queryParts.length > 0) {
    notation += `D{${queryParts.join(',')}}`
  }
  
  return notation
}

function replaceToNotation(replace: ReplaceModifier | ReplaceModifier[]): string {
  const rules = Array.isArray(replace) ? replace : [replace]
  const parts: string[] = []
  
  for (const rule of rules) {
    let fromStr: string
    
    if (typeof rule.from === 'number') {
      fromStr = String(rule.from)
    } else {
      if (rule.from.greaterThan !== undefined) {
        fromStr = `>${rule.from.greaterThan}`
      } else if (rule.from.lessThan !== undefined) {
        fromStr = `<${rule.from.lessThan}`
      } else {
        continue
      }
    }
    
    parts.push(`${fromStr}=${rule.to}`)
  }
  
  return parts.length > 0 ? `V{${parts.join(',')}}` : ''
}

function rerollToNotation(reroll: RerollModifier): string {
  const parts: string[] = []
  
  if (reroll.exact && reroll.exact.length > 0) {
    parts.push(...reroll.exact.map(String))
  }
  
  if (reroll.greaterThan !== undefined) {
    parts.push(`>${reroll.greaterThan}`)
  }
  
  if (reroll.lessThan !== undefined) {
    parts.push(`<${reroll.lessThan}`)
  }
  
  let notation = parts.length > 0 ? `R{${parts.join(',')}}` : ''
  
  if (reroll.max !== undefined) {
    notation += reroll.max
  }
  
  return notation
}

function uniqueToNotation(unique: UniqueModifier): string {
  if (unique === true) {
    return 'U'
  }
  
  if (unique.notUnique && unique.notUnique.length > 0) {
    return `U{${unique.notUnique.join(',')}}`
  }
  
  return 'U'
}

// Helper functions for description conversion

function capToDescription(cap: CapModifier): string[] {
  const descriptions: string[] = []
  
  if (cap.greaterThan !== undefined) {
    descriptions.push(`No Rolls greater than [${cap.greaterThan}]`)
  }
  
  if (cap.lessThan !== undefined) {
    descriptions.push(`No Rolls less than [${cap.lessThan}]`)
  }
  
  return descriptions
}

function dropToDescription(drop: DropModifier): string[] {
  const descriptions: string[] = []
  
  if (drop.highest !== undefined) {
    descriptions.push(
      drop.highest === 1 ? 'Drop highest' : `Drop highest ${drop.highest}`
    )
  }
  
  if (drop.lowest !== undefined) {
    descriptions.push(drop.lowest === 1 ? 'Drop lowest' : `Drop lowest ${drop.lowest}`)
  }
  
  if (drop.exact && drop.exact.length > 0) {
    const formatted = drop.exact.map(v => `[${v}]`)
    if (formatted.length === 1) {
      descriptions.push(`Drop ${formatted[0]}`)
    } else if (formatted.length === 2) {
      descriptions.push(`Drop ${formatted[0]} and ${formatted[1]}`)
    } else {
      const last = formatted.pop()
      descriptions.push(`Drop ${formatted.join(', ')} and ${last}`)
    }
  }
  
  if (drop.greaterThan !== undefined) {
    descriptions.push(`Drop greater than [${drop.greaterThan}]`)
  }
  
  if (drop.lessThan !== undefined) {
    descriptions.push(`Drop less than [${drop.lessThan}]`)
  }
  
  return descriptions
}

function replaceToDescription(replace: ReplaceModifier | ReplaceModifier[]): string[] {
  const rules = Array.isArray(replace) ? replace : [replace]
  const descriptions: string[] = []
  
  for (const rule of rules) {
    let fromStr: string
    
    if (typeof rule.from === 'number') {
      fromStr = `[${rule.from}]`
    } else {
      if (rule.from.greaterThan !== undefined) {
        fromStr = `greater than [${rule.from.greaterThan}]`
      } else if (rule.from.lessThan !== undefined) {
        fromStr = `less than [${rule.from.lessThan}]`
      } else {
        continue
      }
    }
    
    descriptions.push(`Replace ${fromStr} with [${rule.to}]`)
  }
  
  return descriptions
}

function rerollToDescription(reroll: RerollModifier): string[] {
  const parts: string[] = []
  
  if (reroll.exact && reroll.exact.length > 0) {
    parts.push(...reroll.exact.map(v => `[${v}]`))
  }
  
  if (reroll.greaterThan !== undefined) {
    parts.push(`greater than [${reroll.greaterThan}]`)
  }
  
  if (reroll.lessThan !== undefined) {
    parts.push(`less than [${reroll.lessThan}]`)
  }
  
  let description = 'Reroll '
  
  if (parts.length === 0) {
    return []
  } else if (parts.length === 1) {
    description += parts[0]
  } else if (parts.length === 2) {
    description += `${parts[0]} and ${parts[1]}`
  } else {
    const last = parts.pop()
    description += `${parts.join(', ')} and ${last}`
  }
  
  if (reroll.max !== undefined) {
    description += ` (up to ${reroll.max} times)`
  }
  
  return [description]
}

function uniqueToDescription(unique: UniqueModifier): string[] {
  if (unique === true) {
    return ['No Duplicate Rolls']
  }
  
  if (unique.notUnique && unique.notUnique.length > 0) {
    const formatted = unique.notUnique.map(v => `[${v}]`)
    if (formatted.length === 1) {
      return [`No Duplicates (except ${formatted[0]})`]
    } else if (formatted.length === 2) {
      return [`No Duplicates (except ${formatted[0]} and ${formatted[1]})`]
    } else {
      const last = formatted.pop()
      return [`No Duplicates (except ${formatted.join(', ')} and ${last})`]
    }
  }
  
  return ['No Duplicate Rolls']
}

