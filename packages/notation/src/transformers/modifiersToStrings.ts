import type { ModifierOptions } from '../types'
import {
  capSchema,
  compoundSchema,
  countFailuresSchema,
  countSuccessesSchema,
  dropSchema,
  explodeSchema,
  explodeSequenceSchema,
  integerDivideSchema,
  keepSchema,
  minusSchema,
  moduloSchema,
  multiplySchema,
  multiplyTotalSchema,
  penetrateSchema,
  plusSchema,
  replaceSchema,
  rerollSchema,
  sortSchema,
  uniqueSchema,
  wildDieSchema
} from '../definitions'

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
  if (modifiers.explodeSequence !== undefined) {
    const n = explodeSequenceSchema.toNotation(modifiers.explodeSequence)
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
  if (modifiers.sort !== undefined) {
    const n = sortSchema.toNotation(modifiers.sort)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.integerDivide !== undefined) {
    const n = integerDivideSchema.toNotation(modifiers.integerDivide)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.modulo !== undefined) {
    const n = moduloSchema.toNotation(modifiers.modulo)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.wildDie !== undefined) {
    const n = wildDieSchema.toNotation(modifiers.wildDie)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.countSuccesses !== undefined) {
    const n = countSuccessesSchema.toNotation(modifiers.countSuccesses)
    if (n !== undefined) parts.push(n)
  }
  if (modifiers.countFailures !== undefined) {
    const n = countFailuresSchema.toNotation(modifiers.countFailures)
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
  if (modifiers.explodeSequence !== undefined)
    parts.push(...explodeSequenceSchema.toDescription(modifiers.explodeSequence))
  if (modifiers.unique !== undefined) parts.push(...uniqueSchema.toDescription(modifiers.unique))
  if (modifiers.multiply !== undefined)
    parts.push(...multiplySchema.toDescription(modifiers.multiply))
  if (modifiers.plus !== undefined) parts.push(...plusSchema.toDescription(modifiers.plus))
  if (modifiers.minus !== undefined) parts.push(...minusSchema.toDescription(modifiers.minus))
  if (modifiers.sort !== undefined) parts.push(...sortSchema.toDescription(modifiers.sort))
  if (modifiers.integerDivide !== undefined)
    parts.push(...integerDivideSchema.toDescription(modifiers.integerDivide))
  if (modifiers.modulo !== undefined) parts.push(...moduloSchema.toDescription(modifiers.modulo))
  if (modifiers.wildDie !== undefined) parts.push(...wildDieSchema.toDescription(modifiers.wildDie))
  if (modifiers.countSuccesses !== undefined)
    parts.push(...countSuccessesSchema.toDescription(modifiers.countSuccesses))
  if (modifiers.countFailures !== undefined)
    parts.push(...countFailuresSchema.toDescription(modifiers.countFailures))
  if (modifiers.multiplyTotal !== undefined)
    parts.push(...multiplyTotalSchema.toDescription(modifiers.multiplyTotal))

  return parts
}
