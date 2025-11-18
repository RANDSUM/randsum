import type { Modifiers, RollOptions } from '../../types'
import { modifierToDescription, modifierToNotation } from '../modifiers'

export function optionsToNotation(options: RollOptions): string {
  const quantity = options.quantity ?? 1
  const sides =
    Array.isArray(options.sides) && options.sides.length > 0
      ? options.sides.length
      : (options.sides as number)

  let notation = `${quantity}d${sides}`

  const { modifiers } = options
  if (modifiers) {
    const parts: string[] = []
    if (modifiers.cap) parts.push(modifierToNotation('cap', modifiers.cap) ?? '')
    if (modifiers.drop) parts.push(modifierToNotation('drop', modifiers.drop) ?? '')
    if (modifiers.replace)
      parts.push(modifierToNotation('replace', modifiers.replace) ?? '')
    if (modifiers.reroll) parts.push(modifierToNotation('reroll', modifiers.reroll) ?? '')
    if (modifiers.explode) parts.push(modifierToNotation('explode', modifiers.explode) ?? '')
    if (modifiers.unique) parts.push(modifierToNotation('unique', modifiers.unique) ?? '')
    if (modifiers.plus !== undefined)
      parts.push(modifierToNotation('plus', modifiers.plus) ?? '')
    if (modifiers.minus !== undefined)
      parts.push(modifierToNotation('minus', modifiers.minus) ?? '')

    notation += parts.join('')
  }

  if (options.arithmetic === 'subtract' && !notation.startsWith('-')) {
    notation = `-${notation}`
  }

  return notation
}

export function optionsToDescription(options: RollOptions): string[] {
  const quantity = options.quantity ?? 1
  const isCustomFaces = Array.isArray(options.sides)
  const sidesCount = isCustomFaces ? options.sides.length : (options.sides as number)

  const descriptions: string[] = []

  if (isCustomFaces) {
    const facesList = (options.sides as string[]).join(', ')
    descriptions.push(
      `Roll ${quantity} Dice with the following sides: ${facesList}`
    )
  } else {
    const plural = quantity === 1 ? 'die' : 'dice'
    descriptions.push(
      `Roll ${quantity} ${sidesCount}-sided ${plural}`
    )
  }

  const { modifiers } = options
  if (modifiers) {
    const addDescriptions = (modifier: keyof Modifiers, kind: any, value: any) => {
      const extra = modifierToDescription(kind as any, value)
      if (extra) descriptions.push(...extra)
    }

    if (modifiers.cap) addDescriptions('cap', 'cap', modifiers.cap)
    if (modifiers.drop) addDescriptions('drop', 'drop', modifiers.drop)
    if (modifiers.replace) addDescriptions('replace', 'replace', modifiers.replace)
    if (modifiers.reroll) addDescriptions('reroll', 'reroll', modifiers.reroll)
    if (modifiers.explode) addDescriptions('explode', 'explode', modifiers.explode)
    if (modifiers.unique !== undefined)
      addDescriptions('unique', 'unique', modifiers.unique)
    if (modifiers.plus !== undefined) addDescriptions('plus', 'plus', modifiers.plus)
    if (modifiers.minus !== undefined) addDescriptions('minus', 'minus', modifiers.minus)
  }

  if (options.arithmetic === 'subtract') {
    descriptions.push('and Subtract the result')
  }

  return descriptions
}


