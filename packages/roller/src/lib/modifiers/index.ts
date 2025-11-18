import type {
  CapModifierOptions,
  DropModifierOptions,
  ReplaceComparison,
  ReplaceModifierOptions,
  ReplaceRule,
  RerollModifierOptions,
  UniqueModifierOptions
} from '../../types'

export { applyModifiers } from './applyModifiers'

export function modifierToDescription(
  modifier:
    | 'plus'
    | 'minus'
    | 'cap'
    | 'drop'
    | 'reroll'
    | 'explode'
    | 'unique'
    | 'replace',
  options:
    | number
    | CapModifierOptions
    | DropModifierOptions
    | RerollModifierOptions
    | UniqueModifierOptions
    | ReplaceModifierOptions
    | boolean
    | undefined
): string[] | undefined {
  if (options === undefined) return undefined

  switch (modifier) {
    case 'plus':
      return [`Add ${options}`]
    case 'minus':
      return [`Subtract ${options}`]
    case 'cap': {
      const opt = options as CapModifierOptions
      const parts: string[] = []
      if (opt.greaterThan !== undefined) {
        parts.push(`No Rolls greater than [${opt.greaterThan}]`)
      }
      if (opt.lessThan !== undefined) {
        parts.push(`No Rolls less than [${opt.lessThan}]`)
      }
      return parts
    }
    case 'drop': {
      const opt = options as DropModifierOptions
      const parts: string[] = []
      // When both highest and lowest are present, put highest first to match tests.
      if (opt.highest !== undefined) {
        parts.push(opt.highest === 1 ? 'Drop highest' : `Drop highest ${opt.highest}`)
      }
      if (opt.lowest !== undefined) {
        parts.push(opt.lowest === 1 ? 'Drop lowest' : `Drop lowest ${opt.lowest}`)
      }
      if (opt.exact && opt.exact.length) {
        if (opt.exact.length === 1) {
          parts.push(`Drop [${opt.exact[0]}]`)
        } else {
          const [first, ...rest] = opt.exact
          parts.push(`Drop [${first}] and [${rest.join('] and [')}]`)
        }
      }
      if (opt.greaterThan !== undefined) {
        parts.push(`Drop greater than [${opt.greaterThan}]`)
      }
      if (opt.lessThan !== undefined) {
        parts.push(`Drop less than [${opt.lessThan}]`)
      }
      return parts
    }
    case 'reroll': {
      const opt = options as RerollModifierOptions
      const pieces: string[] = []
      if (opt.exact && opt.exact.length) {
        if (opt.exact.length === 1) {
          pieces.push(`Reroll [${opt.exact[0]}]`)
        } else if (opt.exact.length === 2) {
          pieces.push(`Reroll [${opt.exact[0]}] and [${opt.exact[1]}]`)
        } else {
          const allButLast = opt.exact.slice(0, -1)
          const last = opt.exact[opt.exact.length - 1]!
          pieces.push(
            `Reroll ${allButLast.map(v => `[${v}]`).join(' ')} and [${last}]`
          )
        }
      }
      const rangeParts: string[] = []
      if (opt.greaterThan !== undefined) {
        rangeParts.push(`greater than [${opt.greaterThan}]`)
      }
      if (opt.lessThan !== undefined) {
        rangeParts.push(`less than [${opt.lessThan}]`)
      }
      if (rangeParts.length) {
        const joiner = pieces.length ? ', ' : 'Reroll '
        pieces.push(`${joiner}${rangeParts.join(' and ')}`.replace(/^Reroll Reroll/, 'Reroll '))
      }
      if (opt.max !== undefined && pieces.length) {
        pieces[pieces.length - 1] = `${pieces[pieces.length - 1]} (up to ${opt.max} times)`
      }
      return pieces.length ? [pieces.join('')] : undefined
    }
    case 'explode':
      return options ? ['Exploding Dice'] : undefined
    case 'unique': {
      const opt = options as UniqueModifierOptions
      if (opt === true) return ['No Duplicate Rolls']
      if (opt.notUnique.length === 0) return ['No Duplicate Rolls']
      return [
        `No Duplicates (except [${opt.notUnique.join('] and [')}])`
      ]
    }
    case 'replace': {
      const asArray: ReplaceRule[] = Array.isArray(options)
        ? (options as ReplaceRule[])
        : [options as ReplaceRule]
      const descriptions: string[] = []
      for (const rule of asArray) {
        const from = rule.from
        if (typeof from === 'number') {
          descriptions.push(`Replace [${from}] with [${rule.to}]`)
        } else {
          const cmp = from as ReplaceComparison
          if (cmp.greaterThan !== undefined) {
            descriptions.push(`Replace greater than [${cmp.greaterThan}] with [${rule.to}]`)
          }
          if (cmp.lessThan !== undefined) {
            descriptions.push(`Replace less than [${cmp.lessThan}] with [${rule.to}]`)
          }
        }
      }
      return descriptions
    }
    default:
      return undefined
  }
}

export function modifierToNotation(
  modifier:
    | 'plus'
    | 'minus'
    | 'cap'
    | 'drop'
    | 'reroll'
    | 'explode'
    | 'unique'
    | 'replace',
  options:
    | number
    | CapModifierOptions
    | DropModifierOptions
    | RerollModifierOptions
    | UniqueModifierOptions
    | ReplaceModifierOptions
    | boolean
    | undefined
): string | undefined {
  if (options === undefined) return undefined

  switch (modifier) {
    case 'plus': {
      const value = options as number
      if (value === 0) return ''
      return value > 0 ? `+${value}` : `${value}`
    }
    case 'minus':
      return options ? `-${options as number}` : ''
    case 'cap': {
      const opt = options as CapModifierOptions
      const parts: string[] = []
      if (opt.greaterThan !== undefined) parts.push(`>${opt.greaterThan}`)
      if (opt.lessThan !== undefined) parts.push(`<${opt.lessThan}`)
      return parts.length ? `C{${parts.join(',')}}` : ''
    }
    case 'drop': {
      const opt = options as DropModifierOptions
      const tokens: string[] = []
      if (opt.highest) {
        tokens.push(opt.highest === 1 ? 'H' : `H${opt.highest}`)
      }
      if (opt.lowest) {
        tokens.push(opt.lowest === 1 ? 'L' : `L${opt.lowest}`)
      }
      const dParts: string[] = []
      if (opt.greaterThan !== undefined) dParts.push(`>${opt.greaterThan}`)
      if (opt.lessThan !== undefined) dParts.push(`<${opt.lessThan}`)
      if (opt.exact && opt.exact.length) dParts.push(...opt.exact.map(v => `${v}`))
      if (dParts.length) {
        tokens.push(`D{${dParts.join(',')}}`)
      }
      return tokens.join('')
    }
    case 'reroll': {
      const opt = options as RerollModifierOptions
      const parts: string[] = []
      if (opt.exact && opt.exact.length) parts.push(...opt.exact.map(v => `${v}`))
      if (opt.greaterThan !== undefined) parts.push(`>${opt.greaterThan}`)
      if (opt.lessThan !== undefined) parts.push(`<${opt.lessThan}`)
      const body = parts.join(',')
      const suffix = opt.max !== undefined ? `${opt.max}` : ''
      return body ? `R{${body}}${suffix}` : ''
    }
    case 'explode':
      return options ? '!' : ''
    case 'unique': {
      const opt = options as UniqueModifierOptions
      if (opt === true) return 'U'
      if (!opt.notUnique.length) return 'U'
      return `U{${opt.notUnique.join(',')}}`
    }
    case 'replace': {
      const asArray: ReplaceRule[] = Array.isArray(options)
        ? (options as ReplaceRule[])
        : [options as ReplaceRule]
      const parts = asArray.map(rule => {
        const from = rule.from
        if (typeof from === 'number') {
          return `${from}=${rule.to}`
        }
        const cmp = from as ReplaceComparison
        if (cmp.greaterThan !== undefined) {
          return `>${cmp.greaterThan}=${rule.to}`
        }
        if (cmp.lessThan !== undefined) {
          return `<${cmp.lessThan}=${rule.to}`
        }
        return ''
      })
      return parts.length ? `V{${parts.join(',')}}` : ''
    }
    default:
      return undefined
  }
}


