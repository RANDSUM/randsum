import type { DiceNotation, ModifierOptions, RollOptions } from './types'
import { NotationParseError, isDiceNotation } from './isDiceNotation'
import {
  capSchema,
  compoundSchema,
  countSuccessesSchema,
  dropSchema,
  explodeSchema,
  keepSchema,
  minusSchema,
  multiplySchema,
  multiplyTotalSchema,
  penetrateSchema,
  plusSchema,
  replaceSchema,
  rerollSchema,
  uniqueSchema
} from './definitions'

export function formatHumanList(values: number[]): string {
  if (!values.length) return ''
  if (values.length === 1) return `${values[0]}`

  const items = values.map(item => `${item}`)
  const last = items.pop()
  return `${items.join(' ')} and ${last}`
}

/**
 * Convert modifier options to a notation string suffix.
 * Processes modifiers in priority order (cap → multiplyTotal).
 */
export function modifiersToNotation(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''
  const parts: string[] = []

  if (modifiers.cap !== undefined) {
    const n = capSchema.toNotation(modifiers.cap)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.drop !== undefined) {
    const n = dropSchema.toNotation(modifiers.drop)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.keep !== undefined) {
    const n = keepSchema.toNotation(modifiers.keep)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.replace !== undefined) {
    const n = replaceSchema.toNotation(modifiers.replace)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.reroll !== undefined) {
    const n = rerollSchema.toNotation(modifiers.reroll)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.explode !== undefined) {
    const n = explodeSchema.toNotation(modifiers.explode)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.compound !== undefined) {
    const n = compoundSchema.toNotation(modifiers.compound)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.penetrate !== undefined) {
    const n = penetrateSchema.toNotation(modifiers.penetrate)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.unique !== undefined) {
    const n = uniqueSchema.toNotation(modifiers.unique)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.multiply !== undefined) {
    const n = multiplySchema.toNotation(modifiers.multiply)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.plus !== undefined) {
    const n = plusSchema.toNotation(modifiers.plus)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.minus !== undefined) {
    const n = minusSchema.toNotation(modifiers.minus)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.countSuccesses !== undefined) {
    const n = countSuccessesSchema.toNotation(modifiers.countSuccesses)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.multiplyTotal !== undefined) {
    const n = multiplyTotalSchema.toNotation(modifiers.multiplyTotal)
    if (n !== undefined) parts.push(n)
  }

  return parts.join('')
}

/**
 * Convert modifier options to an array of human-readable description strings.
 * Processes modifiers in priority order (cap → multiplyTotal).
 */
export function modifiersToDescription(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []
  const parts: string[] = []

  if (modifiers.cap !== undefined) parts.push(...capSchema.toDescription(modifiers.cap))
  if (modifiers.drop !== undefined) parts.push(...dropSchema.toDescription(modifiers.drop))
  if (modifiers.keep !== undefined) parts.push(...keepSchema.toDescription(modifiers.keep))
  if (modifiers.replace !== undefined) parts.push(...replaceSchema.toDescription(modifiers.replace))
  if (modifiers.reroll !== undefined) parts.push(...rerollSchema.toDescription(modifiers.reroll))
  if (modifiers.explode !== undefined) parts.push(...explodeSchema.toDescription(modifiers.explode))
  if (modifiers.compound !== undefined)
    parts.push(...compoundSchema.toDescription(modifiers.compound))
  if (modifiers.penetrate !== undefined)
    parts.push(...penetrateSchema.toDescription(modifiers.penetrate))
  if (modifiers.unique !== undefined) parts.push(...uniqueSchema.toDescription(modifiers.unique))
  if (modifiers.multiply !== undefined)
    parts.push(...multiplySchema.toDescription(modifiers.multiply))
  if (modifiers.plus !== undefined) parts.push(...plusSchema.toDescription(modifiers.plus))
  if (modifiers.minus !== undefined) parts.push(...minusSchema.toDescription(modifiers.minus))
  if (modifiers.countSuccesses !== undefined)
    parts.push(...countSuccessesSchema.toDescription(modifiers.countSuccesses))
  if (modifiers.multiplyTotal !== undefined)
    parts.push(...multiplyTotalSchema.toDescription(modifiers.multiplyTotal))

  return parts
}

export function optionsToSidesFaces<T>({ sides }: RollOptions<T>): {
  sides: number
  faces?: T[]
} {
  if (Array.isArray(sides)) {
    return { sides: sides.length, faces: sides }
  }
  return { sides }
}

/**
 * Converts roll options to RANDSUM dice notation string.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to convert
 * @returns Dice notation string (e.g., "4d6L", "2d20H+5")
 * @throws NotationParseError if generated notation is invalid
 */
export function optionsToNotation<T = string>(options: RollOptions<T>): DiceNotation {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides } = optionsToSidesFaces(options)
  const arithmeticPrefix = arithmetic === 'subtract' ? '-' : ''
  const modifierSuffix = modifiersToNotation(modifiers)
  const proposed = `${arithmeticPrefix}${quantity}d${sides}${modifierSuffix}`

  if (!isDiceNotation(proposed)) {
    throw new NotationParseError(proposed, 'Generated notation is invalid')
  }
  return proposed
}

/**
 * Converts roll options to a human-readable description.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to describe
 * @returns Array of description strings
 */
export function optionsToDescription<T = string>(options: RollOptions<T>): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)
  const descriptor = quantity === 1 ? 'die' : 'dice'
  const coreDescription = `Roll ${quantity} ${sides}-sided ${descriptor}`
  const customCoreDescription = `Roll ${quantity} Dice with the following sides: ${faces.join(', ')}`
  const modifierDescription = modifiersToDescription(modifiers)
  const arithmeticDescription = arithmetic === 'subtract' ? 'and Subtract the result' : ''

  return [
    faces.length ? customCoreDescription : coreDescription,
    ...modifierDescription,
    arithmeticDescription
  ].filter(Boolean)
}
