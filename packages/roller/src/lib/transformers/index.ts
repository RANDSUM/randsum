import type { Modifiers, RollOptions } from '../../types'
import { modifierToDescription, modifierToNotation } from '../modifiers'

export function optionsToNotation(options: RollOptions): string {
  const sides = typeof options.sides === 'number' ? options.sides : options.sides.length
  const quantity = options.quantity ?? 1
  let notation = `${quantity}d${sides}`

  if (!options.modifiers) {
    return notation
  }

  const modifierParts: string[] = []

  // Order modifiers according to standard notation
  // Cap first
  if (options.modifiers.cap) {
    const capNotation = modifierToNotation('cap', options.modifiers.cap)
    if (capNotation) modifierParts.push(capNotation)
  }

  // Drop highest
  if (options.modifiers.drop?.highest) {
    const dropNotation = modifierToNotation('drop', { highest: options.modifiers.drop.highest })
    if (dropNotation) modifierParts.push(dropNotation.replace(/^[LD].*/, 'H' + (options.modifiers.drop.highest === 1 ? '' : options.modifiers.drop.highest)))
  }

  // Drop lowest
  if (options.modifiers.drop?.lowest) {
    const dropNotation = modifierToNotation('drop', { lowest: options.modifiers.drop.lowest })
    if (dropNotation) modifierParts.push(dropNotation.replace(/^[HD].*/, 'L' + (options.modifiers.drop.lowest === 1 ? '' : options.modifiers.drop.lowest)))
  }

  // Drop other
  if (options.modifiers.drop && (options.modifiers.drop.exact || options.modifiers.drop.greaterThan !== undefined || options.modifiers.drop.lessThan !== undefined)) {
    const dropOther: any = {}
    if (options.modifiers.drop.exact) dropOther.exact = options.modifiers.drop.exact
    if (options.modifiers.drop.greaterThan !== undefined) dropOther.greaterThan = options.modifiers.drop.greaterThan
    if (options.modifiers.drop.lessThan !== undefined) dropOther.lessThan = options.modifiers.drop.lessThan
    const dropNotation = modifierToNotation('drop', dropOther)
    if (dropNotation) modifierParts.push(dropNotation)
  }

  // Replace
  if (options.modifiers.replace) {
    const replaceNotation = modifierToNotation('replace', options.modifiers.replace)
    if (replaceNotation) modifierParts.push(replaceNotation)
  }

  // Reroll
  if (options.modifiers.reroll) {
    const rerollNotation = modifierToNotation('reroll', options.modifiers.reroll)
    if (rerollNotation) modifierParts.push(rerollNotation)
  }

  // Explode
  if (options.modifiers.explode) {
    modifierParts.push('!')
  }

  // Unique
  if (options.modifiers.unique) {
    const uniqueNotation = modifierToNotation('unique', options.modifiers.unique)
    if (uniqueNotation) modifierParts.push(uniqueNotation)
  }

  // Arithmetic modifiers
  if (options.modifiers.plus !== undefined) {
    const plusNotation = modifierToNotation('plus', options.modifiers.plus)
    if (plusNotation) modifierParts.push(plusNotation)
  }
  if (options.modifiers.minus !== undefined) {
    const minusNotation = modifierToNotation('minus', options.modifiers.minus)
    if (minusNotation) modifierParts.push(minusNotation)
  }

  return notation + modifierParts.join('')
}

export function optionsToDescription(options: RollOptions): string[] {
  const sides = typeof options.sides === 'number' ? options.sides : options.sides.length
  const quantity = options.quantity ?? 1
  const description: string[] = []

  // Base description
  if (typeof options.sides === 'number') {
    if (quantity === 1) {
      description.push(`Roll 1 ${sides}-sided die`)
    } else {
      description.push(`Roll ${quantity} ${sides}-sided dice`)
    }
  } else {
    const facesList = options.sides.join(', ')
    description.push(`Roll ${quantity} Dice with the following sides: ${facesList}`)
  }

  // Modifier descriptions
  if (options.modifiers) {
    const modifierDescriptions = getModifierDescriptions(options.modifiers)
    description.push(...modifierDescriptions)
  }

  // Arithmetic description
  if (options.arithmetic === 'subtract') {
    description.push('and Subtract the result')
  }

  return description
}

function getModifierDescriptions(modifiers: Modifiers): string[] {
  const descriptions: string[] = []

  // Order matters for description
  if (modifiers.cap) {
    const desc = modifierToDescription('cap', modifiers.cap)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.drop) {
    const dropDesc: string[] = []
    if (modifiers.drop.highest) {
      const desc = modifierToDescription('drop', { highest: modifiers.drop.highest })
      if (desc) dropDesc.push(...desc)
    }
    if (modifiers.drop.lowest) {
      const desc = modifierToDescription('drop', { lowest: modifiers.drop.lowest })
      if (desc) dropDesc.push(...desc)
    }
    if (modifiers.drop.exact || modifiers.drop.greaterThan !== undefined || modifiers.drop.lessThan !== undefined) {
      const dropOther: any = {}
      if (modifiers.drop.exact) dropOther.exact = modifiers.drop.exact
      if (modifiers.drop.greaterThan !== undefined) dropOther.greaterThan = modifiers.drop.greaterThan
      if (modifiers.drop.lessThan !== undefined) dropOther.lessThan = modifiers.drop.lessThan
      const desc = modifierToDescription('drop', dropOther)
      if (desc) dropDesc.push(...desc)
    }
    descriptions.push(...dropDesc)
  }

  if (modifiers.replace) {
    const desc = modifierToDescription('replace', modifiers.replace)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.reroll) {
    const desc = modifierToDescription('reroll', modifiers.reroll)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.explode) {
    const desc = modifierToDescription('explode', modifiers.explode)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.unique) {
    const desc = modifierToDescription('unique', modifiers.unique)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.plus !== undefined) {
    const desc = modifierToDescription('plus', modifiers.plus)
    if (desc) descriptions.push(...desc)
  }

  if (modifiers.minus !== undefined) {
    const desc = modifierToDescription('minus', modifiers.minus)
    if (desc) descriptions.push(...desc)
  }

  return descriptions
}

