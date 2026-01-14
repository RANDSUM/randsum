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
import { MODIFIER_ORDER } from './constants'

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

// Individual description handler functions
function handlePlusDescription(options: number): string[] {
  return [`Add ${options}`]
}

function handleMinusDescription(options: number): string[] {
  return [`Subtract ${options}`]
}

function handleCapDescription(options: ComparisonOptions): string[] {
  return formatComparisonDescription(options).map(str => `No Rolls ${str}`)
}

function handleDropDescription(options: DropOptions): string[] {
  return formatDropDescription(options)
}

function handleRerollDescription(options: RerollOptions): string[] {
  return formatRerollDescription(options)
}

function handleExplodeDescription(): string[] {
  return ['Exploding Dice']
}

function handleUniqueDescription(options: boolean | UniqueOptions): string[] {
  if (typeof options === 'boolean') {
    return ['No Duplicate Rolls']
  }
  return [`No Duplicates (except ${formatHumanList(options.notUnique)})`]
}

function handleReplaceDescription(options: ReplaceOptions | ReplaceOptions[]): string[] {
  return formatReplaceDescription(options)
}

// Individual notation handler functions
function handlePlusNotation(options: number): string | undefined {
  if (options < 0) {
    return `-${Math.abs(options)}`
  }
  return `+${options}`
}

function handleMinusNotation(options: number): string | undefined {
  return `-${options}`
}

function handleCapNotation(options: ComparisonOptions): string | undefined {
  const capList = formatComparisonNotation(options)
  return capList.length ? `C{${capList.join(',')}}` : undefined
}

function handleDropNotation(options: DropOptions): string | undefined {
  return formatDropNotation(options)
}

function handleRerollNotation(options: RerollOptions): string | undefined {
  return formatRerollNotation(options)
}

function handleExplodeNotation(): string | undefined {
  return '!'
}

function handleUniqueNotation(options: boolean | UniqueOptions): string | undefined {
  if (typeof options === 'boolean') return 'U'
  return `U{${options.notUnique.join(',')}}`
}

function handleReplaceNotation(options: ReplaceOptions | ReplaceOptions[]): string | undefined {
  return formatReplaceNotation(options)
}

/**
 * Converts a modifier to its human-readable description.
 * Uses switch-based dispatch for type safety.
 */
export function modifierToDescription(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string[] | undefined {
  if (options === undefined) return undefined

  switch (type) {
    case 'plus':
      // Safe: when type === 'plus', options is guaranteed to be number
      return handlePlusDescription(options as number)
    case 'minus':
      // Safe: when type === 'minus', options is guaranteed to be number
      return handleMinusDescription(options as number)
    case 'cap':
      // Safe: when type === 'cap', options is guaranteed to be ComparisonOptions
      return handleCapDescription(options as ComparisonOptions)
    case 'drop':
      // Safe: when type === 'drop', options is guaranteed to be DropOptions
      return handleDropDescription(options as DropOptions)
    case 'reroll':
      // Safe: when type === 'reroll', options is guaranteed to be RerollOptions
      return handleRerollDescription(options as RerollOptions)
    case 'explode':
      // Safe: when type === 'explode', options is guaranteed to be boolean
      return handleExplodeDescription()
    case 'unique':
      // Safe: when type === 'unique', options is guaranteed to be boolean | UniqueOptions
      return handleUniqueDescription(options as boolean | UniqueOptions)
    case 'replace':
      // Safe: when type === 'replace', options is guaranteed to be ReplaceOptions | ReplaceOptions[]
      return handleReplaceDescription(options as ReplaceOptions | ReplaceOptions[])
    default: {
      // Exhaustiveness check - TypeScript will error if a modifier type is missing
      const _exhaustive: never = type
      throw new Error(`Unknown modifier type: ${String(_exhaustive)}`)
    }
  }
}

/**
 * Converts a modifier to its notation string.
 * Uses switch-based dispatch for type safety.
 */
export function modifierToNotation(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string | undefined {
  if (options === undefined) return undefined

  switch (type) {
    case 'plus':
      // Safe: when type === 'plus', options is guaranteed to be number
      return handlePlusNotation(options as number)
    case 'minus':
      // Safe: when type === 'minus', options is guaranteed to be number
      return handleMinusNotation(options as number)
    case 'cap':
      // Safe: when type === 'cap', options is guaranteed to be ComparisonOptions
      return handleCapNotation(options as ComparisonOptions)
    case 'drop':
      // Safe: when type === 'drop', options is guaranteed to be DropOptions
      return handleDropNotation(options as DropOptions)
    case 'reroll':
      // Safe: when type === 'reroll', options is guaranteed to be RerollOptions
      return handleRerollNotation(options as RerollOptions)
    case 'explode':
      // Safe: when type === 'explode', options is guaranteed to be boolean
      return handleExplodeNotation()
    case 'unique':
      // Safe: when type === 'unique', options is guaranteed to be boolean | UniqueOptions
      return handleUniqueNotation(options as boolean | UniqueOptions)
    case 'replace':
      // Safe: when type === 'replace', options is guaranteed to be ReplaceOptions | ReplaceOptions[]
      return handleReplaceNotation(options as ReplaceOptions | ReplaceOptions[])
    default: {
      // Exhaustiveness check - TypeScript will error if a modifier type is missing
      const _exhaustive: never = type
      throw new Error(`Unknown modifier type: ${String(_exhaustive)}`)
    }
  }
}

export function processModifierDescriptions(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []

  return MODIFIER_ORDER.map(type => modifierToDescription(type, modifiers[type]))
    .flat()
    .filter((desc): desc is string => typeof desc === 'string')
    .filter(desc => desc.length > 0)
}

export function processModifierNotations(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''

  return MODIFIER_ORDER.map(type => modifierToNotation(type, modifiers[type]))
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}
