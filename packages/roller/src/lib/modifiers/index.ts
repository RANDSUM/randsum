import type {
  NumericRollBonus,
  RequiredNumericRollParameters,
  DropModifier,
  RerollModifier,
  CapModifier,
  ReplaceModifier,
  UniqueModifier,
  ComparisonQuery
} from '../../types'
import {
  applyPlus,
  applyMinus,
  applyCap,
  applyDrop,
  applyReroll,
  applyExplode,
  applyUnique,
  applyReplace
} from './applyModifiers'

export type ModifierType =
  | 'plus'
  | 'minus'
  | 'cap'
  | 'drop'
  | 'reroll'
  | 'explode'
  | 'unique'
  | 'replace'

/**
 * Apply a single modifier to a roll bonus
 */
export function applyModifiers(
  modifier: ModifierType,
  options: unknown,
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: () => number
): NumericRollBonus {
  switch (modifier) {
    case 'plus':
      return applyPlus(options as number | undefined, bonus)
    case 'minus':
      return applyMinus(options as number | undefined, bonus)
    case 'cap':
      return applyCap(options as CapModifier | undefined, bonus)
    case 'drop':
      return applyDrop(options as DropModifier | undefined, bonus)
    case 'reroll':
      return applyReroll(
        options as RerollModifier | undefined,
        bonus,
        context,
        rollOne
      )
    case 'explode':
      return applyExplode(options as boolean | undefined, bonus, context, rollOne)
    case 'unique':
      return applyUnique(
        options as UniqueModifier | undefined,
        bonus,
        context,
        rollOne
      )
    case 'replace':
      return applyReplace(
        options as ReplaceModifier | ReplaceModifier[] | undefined,
        bonus
      )
    default:
      return bonus
  }
}

/**
 * Convert a modifier to notation string
 */
export function modifierToNotation(
  modifier: ModifierType,
  options: unknown
): string | undefined {
  if (options === undefined) return undefined
  
  switch (modifier) {
    case 'plus':
      if (typeof options === 'number') {
        return options < 0 ? String(options) : `+${options}`
      }
      return undefined
      
    case 'minus':
      if (typeof options === 'number') {
        return `-${options}`
      }
      return undefined
      
    case 'cap': {
      const cap = options as CapModifier
      const parts: string[] = []
      
      if (cap.greaterThan !== undefined) {
        parts.push(`>${cap.greaterThan}`)
      }
      
      if (cap.lessThan !== undefined) {
        parts.push(`<${cap.lessThan}`)
      }
      
      return parts.length > 0 ? `C{${parts.join(',')}}` : undefined
    }
    
    case 'drop': {
      const drop = options as DropModifier
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
      
      return notation || undefined
    }
    
    case 'reroll': {
      const reroll = options as RerollModifier
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
      
      return notation || undefined
    }
    
    case 'explode':
      return options === true ? '!' : undefined
      
    case 'unique': {
      const unique = options as UniqueModifier
      
      if (unique === true) {
        return 'U'
      }
      
      if (typeof unique === 'object' && unique.notUnique && unique.notUnique.length > 0) {
        return `U{${unique.notUnique.join(',')}}`
      }
      
      return 'U'
    }
    
    case 'replace': {
      const replace = options as ReplaceModifier | ReplaceModifier[]
      const rules = Array.isArray(replace) ? replace : [replace]
      const parts: string[] = []
      
      for (const rule of rules) {
        let fromStr: string
        
        if (typeof rule.from === 'number') {
          fromStr = String(rule.from)
        } else {
          const query = rule.from as ComparisonQuery
          if (query.greaterThan !== undefined) {
            fromStr = `>${query.greaterThan}`
          } else if (query.lessThan !== undefined) {
            fromStr = `<${query.lessThan}`
          } else {
            continue
          }
        }
        
        parts.push(`${fromStr}=${rule.to}`)
      }
      
      return parts.length > 0 ? `V{${parts.join(',')}}` : undefined
    }
    
    default:
      return undefined
  }
}

/**
 * Convert a modifier to description array
 */
export function modifierToDescription(
  modifier: ModifierType,
  options: unknown
): string[] | undefined {
  if (options === undefined) return undefined
  
  switch (modifier) {
    case 'plus':
      if (typeof options === 'number') {
        return [`Add ${options}`]
      }
      return undefined
      
    case 'minus':
      if (typeof options === 'number') {
        return [`Subtract ${options}`]
      }
      return undefined
      
    case 'cap': {
      const cap = options as CapModifier
      const descriptions: string[] = []
      
      if (cap.greaterThan !== undefined) {
        descriptions.push(`No Rolls greater than [${cap.greaterThan}]`)
      }
      
      if (cap.lessThan !== undefined) {
        descriptions.push(`No Rolls less than [${cap.lessThan}]`)
      }
      
      return descriptions.length > 0 ? descriptions : undefined
    }
    
    case 'drop': {
      const drop = options as DropModifier
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
      
      return descriptions.length > 0 ? descriptions : undefined
    }
    
    case 'reroll': {
      const reroll = options as RerollModifier
      const exactParts: string[] = []
      const conditionParts: string[] = []
      
      if (reroll.exact && reroll.exact.length > 0) {
        exactParts.push(...reroll.exact.map(v => `[${v}]`))
      }
      
      if (reroll.greaterThan !== undefined) {
        conditionParts.push(`greater than [${reroll.greaterThan}]`)
      }
      
      if (reroll.lessThan !== undefined) {
        conditionParts.push(`less than [${reroll.lessThan}]`)
      }
      
      if (exactParts.length === 0 && conditionParts.length === 0) return undefined
      
      let description = 'Reroll '
      
      // Format exact values with spaces, not commas
      if (exactParts.length > 0 && conditionParts.length === 0) {
        if (exactParts.length === 1) {
          description += exactParts[0]
        } else if (exactParts.length === 2) {
          description += `${exactParts[0]} and ${exactParts[1]}`
        } else {
          const last = exactParts.pop()
          description += `${exactParts.join(' ')} and ${last}`
        }
      } else if (exactParts.length === 0 && conditionParts.length > 0) {
        if (conditionParts.length === 1) {
          description += conditionParts[0]
        } else {
          description += conditionParts.join(' and ')
        }
      } else {
        // Mix of exact and conditions
        const allParts = [...exactParts, ...conditionParts]
        if (allParts.length === 2) {
          description += `${allParts[0]} and ${allParts[1]}`
        } else {
          const last = allParts.pop()
          description += `${exactParts.join(' ')}, ${conditionParts.join(' and ')} and ${last}`
        }
      }
      
      if (reroll.max !== undefined) {
        description += ` (up to ${reroll.max} times)`
      }
      
      return [description]
    }
    
    case 'explode':
      return options === true ? ['Exploding Dice'] : undefined
      
    case 'unique': {
      const unique = options as UniqueModifier
      
      if (unique === true) {
        return ['No Duplicate Rolls']
      }
      
      if (typeof unique === 'object' && unique.notUnique && unique.notUnique.length > 0) {
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
    
    case 'replace': {
      const replace = options as ReplaceModifier | ReplaceModifier[]
      const rules = Array.isArray(replace) ? replace : [replace]
      const descriptions: string[] = []
      
      for (const rule of rules) {
        let fromStr: string
        
        if (typeof rule.from === 'number') {
          fromStr = `[${rule.from}]`
        } else {
          const query = rule.from as ComparisonQuery
          if (query.greaterThan !== undefined) {
            fromStr = `greater than [${query.greaterThan}]`
          } else if (query.lessThan !== undefined) {
            fromStr = `less than [${query.lessThan}]`
          } else {
            continue
          }
        }
        
        descriptions.push(`Replace ${fromStr} with [${rule.to}]`)
      }
      
      return descriptions.length > 0 ? descriptions : undefined
    }
    
    default:
      return undefined
  }
}

