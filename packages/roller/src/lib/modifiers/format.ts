import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  formatHumanList
} from '../comparisonUtils'
import type { DescriptionHandler, NotationHandler } from './types'

// Description formatting functions
export function formatDropDescription({
  highest,
  lowest,
  greaterThan,
  lessThan,
  exact
}: DropOptions): string[] {
  const descriptions: string[] = []

  if (highest) {
    if (highest > 1) {
      descriptions.push(`Drop highest ${highest}`)
    } else {
      descriptions.push('Drop highest')
    }
  }

  if (lowest) {
    if (lowest > 1) {
      descriptions.push(`Drop lowest ${lowest}`)
    } else {
      descriptions.push('Drop lowest')
    }
  }

  if (exact) {
    descriptions.push(`Drop ${formatHumanList(exact)}`)
  }

  if (greaterThan !== undefined) {
    descriptions.push(`Drop greater than [${greaterThan}]`)
  }

  if (lessThan !== undefined) {
    descriptions.push(`Drop less than [${lessThan}]`)
  }

  return descriptions
}

export function formatReplaceDescription(options: ReplaceOptions | ReplaceOptions[]): string[] {
  const rules = Array.isArray(options) ? options : [options]
  return rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonDescription(from)
      return `Replace ${comparisons.join(' and ')} with [${to}]`
    }
    return `Replace [${from}] with [${to}]`
  })
}

export function formatRerollDescription({
  exact,
  greaterThan,
  lessThan,
  max
}: RerollOptions): string[] {
  const rerollList: string[] = []

  if (exact) {
    exact.forEach(roll => rerollList.push(`${roll}`))
  }

  const greaterLessList: string[] = []
  if (greaterThan !== undefined) {
    greaterLessList.push(`greater than [${greaterThan}]`)
  }
  if (lessThan !== undefined) {
    greaterLessList.push(`less than [${lessThan}]`)
  }

  const exactList = formatHumanList(rerollList.map(Number))
  const greaterLess = greaterLessList.join(' and ')

  const conditions = [exactList, greaterLess].filter(Boolean).join(', ')
  if (!conditions) return []

  const maxText = max !== undefined ? ` (up to ${max} times)` : ''
  return [`Reroll ${conditions}${maxText}`]
}

// Notation formatting functions
export function formatDropNotation({
  highest,
  lowest,
  greaterThan,
  lessThan,
  exact
}: DropOptions): string | undefined {
  const parts: string[] = []

  if (highest) {
    parts.push(highest === 1 ? 'H' : `H${highest}`)
  }

  if (lowest) {
    parts.push(lowest === 1 ? 'L' : `L${lowest}`)
  }

  const dropList: string[] = []

  if (greaterThan !== undefined) {
    dropList.push(`>${greaterThan}`)
  }

  if (lessThan !== undefined) {
    dropList.push(`<${lessThan}`)
  }

  if (exact) {
    exact.forEach(roll => dropList.push(`${roll}`))
  }

  if (dropList.length > 0) {
    parts.push(`D{${dropList.join(',')}}`)
  }

  return parts.length ? parts.join('') : undefined
}

export function formatReplaceNotation(
  options: ReplaceOptions | ReplaceOptions[]
): string | undefined {
  const rules = Array.isArray(options) ? options : [options]
  const notations = rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonNotation(from)
      return comparisons.map(comp => `${comp}=${to}`).join(',')
    }
    return `${from}=${to}`
  })

  return notations.length ? `V{${notations.join(',')}}` : undefined
}

export function formatRerollNotation(options: RerollOptions): string | undefined {
  const parts = formatComparisonNotation(options)
  if (!parts.length) return undefined

  const maxSuffix = options.max ? `${options.max}` : ''
  return `R{${parts.join(',')}}${maxSuffix}`
}

// Description handlers map
export const DESCRIPTION_HANDLERS: ReadonlyMap<keyof ModifierOptions, DescriptionHandler> = new Map<
  keyof ModifierOptions,
  DescriptionHandler
>([
  ['plus', options => [`Add ${options as number}`]],
  ['minus', options => [`Subtract ${options as number}`]],
  [
    'cap',
    options =>
      formatComparisonDescription(options as ComparisonOptions).map(str => `No Rolls ${str}`)
  ],
  ['drop', options => formatDropDescription(options as DropOptions)],
  ['reroll', options => formatRerollDescription(options as RerollOptions)],
  ['explode', () => ['Exploding Dice']],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') {
        return ['No Duplicate Rolls']
      }
      return [`No Duplicates (except ${formatHumanList((options as UniqueOptions).notUnique)})`]
    }
  ],
  ['replace', options => formatReplaceDescription(options as ReplaceOptions | ReplaceOptions[])]
])

// Notation handlers map
export const NOTATION_HANDLERS: ReadonlyMap<keyof ModifierOptions, NotationHandler> = new Map<
  keyof ModifierOptions,
  NotationHandler
>([
  [
    'plus',
    options => {
      const numOptions = options as number
      if (numOptions < 0) {
        return `-${Math.abs(numOptions)}`
      }
      return `+${numOptions}`
    }
  ],
  ['minus', options => `-${options as number}`],
  [
    'cap',
    options => {
      const capList = formatComparisonNotation(options as ComparisonOptions)
      return capList.length ? `C{${capList.join(',')}}` : undefined
    }
  ],
  ['drop', options => formatDropNotation(options as DropOptions)],
  ['reroll', options => formatRerollNotation(options as RerollOptions)],
  ['explode', () => '!'],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') return 'U'
      return `U{${(options as UniqueOptions).notUnique.join(',')}}`
    }
  ],
  ['replace', options => formatReplaceNotation(options as ReplaceOptions | ReplaceOptions[])]
])

// Convenience functions
export function modifierToDescription(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string[] | undefined {
  if (options === undefined) return undefined

  const handler = DESCRIPTION_HANDLERS.get(type)
  return handler ? handler(options) : undefined
}

export function modifierToNotation(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string | undefined {
  if (options === undefined) return undefined

  const handler = NOTATION_HANDLERS.get(type)
  return handler ? handler(options) : undefined
}
