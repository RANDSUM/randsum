import type { RollOptions, RollParams, Arithmetic } from '../../types'
import { notationToOptions } from '../../lib/notation'
import { optionsToNotation, optionsToDescription } from '../../lib/transformers'
import { isDiceNotation } from '../../isDiceNotation'

/**
 * Convert a roll argument to RollParams
 * Handles numbers, strings (notation), and RollOptions objects
 * 
 * @param arg - The argument to convert (number, string, or RollOptions)
 * @param index - The index of this roll (for generating keys)
 * @returns An array of RollParams (multiple if multi-dice notation)
 */
export function argToParameter(
  arg: number | string | RollOptions,
  index: number
): RollParams[] {
  // Handle number argument
  if (typeof arg === 'number') {
    return [
      {
        sides: arg,
        quantity: 1,
        modifiers: {},
        notation: `1d${arg}`,
        description: [`Roll 1 ${arg}-sided die`],
        key: `Roll ${index}`,
        argument: arg,
        arithmetic: 'add'
      }
    ]
  }
  
  // Handle string (notation) argument
  if (typeof arg === 'string') {
    const trimmed = arg.trim()
    
    if (!isDiceNotation(trimmed)) {
      throw new Error(`Invalid dice notation: ${arg}`)
    }
    
    const options = notationToOptions(trimmed)
    
    return options.map((opt, idx) => {
      return optionsToParams(opt, idx === 0 ? index : index + idx, arg)
    })
  }
  
  // Handle RollOptions object
  return [optionsToParams(arg, index, arg)]
}

/**
 * Convert RollOptions to RollParams
 */
function optionsToParams(
  options: RollOptions,
  index: number,
  originalArg: string | number | RollOptions
): RollParams {
  // Handle custom faces
  let sides: number
  let faces: string[] | undefined
  
  if (Array.isArray(options.sides)) {
    faces = options.sides
    sides = options.sides.length
  } else {
    sides = options.sides
  }
  
  const quantity = options.quantity ?? 1
  const arithmetic: Arithmetic = options.arithmetic ?? 'add'
  const modifiers = options.modifiers ?? {}
  
  // Generate notation and description
  const notation = optionsToNotation({
    ...options,
    sides,
    quantity,
    modifiers
  })
  
  const description = optionsToDescription({
    ...options,
    sides: faces ?? sides,
    quantity,
    modifiers
  })
  
  return {
    sides,
    quantity,
    modifiers,
    notation,
    description,
    key: `Roll ${index}`,
    argument: originalArg,
    arithmetic,
    faces
  }
}

