import type { Modifiers } from '../../types'

export function modifierToDescription(modifierType: keyof Modifiers, options: unknown): string[] | undefined {
  if (options === undefined) {
    return undefined
  }

  switch (modifierType) {
    case 'plus':
      return [`Add ${options}`]

    case 'minus':
      return [`Subtract ${options}`]

    case 'cap': {
      const cap = options as { greaterThan?: number; lessThan?: number }
      const desc: string[] = []
      if (cap.greaterThan !== undefined) {
        desc.push(`No Rolls greater than [${cap.greaterThan}]`)
      }
      if (cap.lessThan !== undefined) {
        desc.push(`No Rolls less than [${cap.lessThan}]`)
      }
      return desc.length > 0 ? desc : undefined
    }

    case 'drop': {
      const drop = options as {
        lowest?: number
        highest?: number
        exact?: number[]
        greaterThan?: number
        lessThan?: number
      }
      const desc: string[] = []
      if (drop.lowest) {
        desc.push(drop.lowest === 1 ? 'Drop lowest' : `Drop lowest ${drop.lowest}`)
      }
      if (drop.highest) {
        desc.push(drop.highest === 1 ? 'Drop highest' : `Drop highest ${drop.highest}`)
      }
      if (drop.exact && drop.exact.length > 0) {
        if (drop.exact.length === 1) {
          desc.push(`Drop [${drop.exact[0]}]`)
        } else {
          desc.push(`Drop [${drop.exact.join('] and [')}]`)
        }
      }
      if (drop.greaterThan !== undefined) {
        desc.push(`Drop greater than [${drop.greaterThan}]`)
      }
      if (drop.lessThan !== undefined) {
        desc.push(`Drop less than [${drop.lessThan}]`)
      }
      return desc.length > 0 ? desc : undefined
    }

    case 'reroll': {
      const reroll = options as {
        exact?: number[]
        greaterThan?: number
        lessThan?: number
        max?: number
      }
      const exactParts: string[] = []
      const comparisonParts: string[] = []
      
      if (reroll.exact && reroll.exact.length > 0) {
        if (reroll.exact.length === 1) {
          exactParts.push(`[${reroll.exact[0]}]`)
        } else {
          exactParts.push(`[${reroll.exact.join('] and [')}]`)
        }
      }
      if (reroll.greaterThan !== undefined) {
        comparisonParts.push(`greater than [${reroll.greaterThan}]`)
      }
      if (reroll.lessThan !== undefined) {
        comparisonParts.push(`less than [${reroll.lessThan}]`)
      }
      
      if (exactParts.length === 0 && comparisonParts.length === 0) {
        return undefined
      }
      
      const allParts: string[] = []
      if (exactParts.length > 0) {
        allParts.push(exactParts.join(', '))
      }
      if (comparisonParts.length > 0) {
        allParts.push(...comparisonParts)
      }
      
      const maxText = reroll.max ? ` (up to ${reroll.max} times)` : ''
      return [`Reroll ${allParts.join(' and ')}${maxText}`]
    }

    case 'explode':
      return ['Exploding Dice']

    case 'unique': {
      if (typeof options === 'boolean') {
        return ['No Duplicate Rolls']
      }
      const unique = options as { notUnique: number[] }
      if (unique.notUnique.length === 0) {
        return ['No Duplicate Rolls']
      }
      if (unique.notUnique.length === 1) {
        return [`No Duplicates (except [${unique.notUnique[0]}])`]
      }
      return [`No Duplicates (except [${unique.notUnique.join('] and [')}])`]
    }

    case 'replace': {
      const replace = Array.isArray(options) ? options : [options]
      const desc: string[] = []
      for (const rule of replace) {
        const from = rule.from
        if (typeof from === 'number') {
          desc.push(`Replace [${from}] with [${rule.to}]`)
        } else {
          if (from.greaterThan !== undefined) {
            desc.push(`Replace greater than [${from.greaterThan}] with [${rule.to}]`)
          }
          if (from.lessThan !== undefined) {
            desc.push(`Replace less than [${from.lessThan}] with [${rule.to}]`)
          }
        }
      }
      return desc.length > 0 ? desc : undefined
    }

    default:
      return undefined
  }
}

export function modifierToNotation(modifierType: keyof Modifiers, options: unknown): string | undefined {
  if (options === undefined) {
    return undefined
  }

  switch (modifierType) {
    case 'plus': {
      const value = options as number
      return value >= 0 ? `+${value}` : `${value}`
    }

    case 'minus':
      return `-${options}`

    case 'cap': {
      const cap = options as { greaterThan?: number; lessThan?: number }
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
      const drop = options as {
        lowest?: number
        highest?: number
        exact?: number[]
        greaterThan?: number
        lessThan?: number
      }
      const parts: string[] = []
      if (drop.lowest) {
        parts.push(drop.lowest === 1 ? 'L' : `L${drop.lowest}`)
      }
      if (drop.highest) {
        parts.push(drop.highest === 1 ? 'H' : `H${drop.highest}`)
      }
      if (drop.exact || drop.greaterThan !== undefined || drop.lessThan !== undefined) {
        const dropParts: string[] = []
        if (drop.greaterThan !== undefined) {
          dropParts.push(`>${drop.greaterThan}`)
        }
        if (drop.lessThan !== undefined) {
          dropParts.push(`<${drop.lessThan}`)
        }
        if (drop.exact) {
          dropParts.push(...drop.exact.map(n => n.toString()))
        }
        if (dropParts.length > 0) {
          parts.push(`D{${dropParts.join(',')}}`)
        }
      }
      return parts.length > 0 ? parts.join('') : undefined
    }

    case 'reroll': {
      const reroll = options as {
        exact?: number[]
        greaterThan?: number
        lessThan?: number
        max?: number
      }
      const parts: string[] = []
      if (reroll.exact && reroll.exact.length > 0) {
        parts.push(...reroll.exact.map(n => n.toString()))
      }
      if (reroll.greaterThan !== undefined) {
        parts.push(`>${reroll.greaterThan}`)
      }
      if (reroll.lessThan !== undefined) {
        parts.push(`<${reroll.lessThan}`)
      }
      
      // Only output reroll notation if there are conditions
      if (parts.length === 0) {
        return undefined
      }
      
      const notation = `R{${parts.join(',')}}`
      return reroll.max ? `${notation}${reroll.max}` : notation
    }

    case 'explode':
      return '!'

    case 'unique': {
      if (typeof options === 'boolean') {
        return 'U'
      }
      const unique = options as { notUnique: number[] }
      if (unique.notUnique.length === 0) {
        return 'U'
      }
      return `U{${unique.notUnique.join(',')}}`
    }

    case 'replace': {
      const replace = Array.isArray(options) ? options : [options]
      const parts: string[] = []
      for (const rule of replace) {
        const from = rule.from
        if (typeof from === 'number') {
          parts.push(`${from}=${rule.to}`)
        } else {
          if (from.greaterThan !== undefined) {
            parts.push(`>${from.greaterThan}=${rule.to}`)
          }
          if (from.lessThan !== undefined) {
            parts.push(`<${from.lessThan}=${rule.to}`)
          }
        }
      }
      return parts.length > 0 ? `V{${parts.join(',')}}` : undefined
    }

    default:
      return undefined
  }
}

