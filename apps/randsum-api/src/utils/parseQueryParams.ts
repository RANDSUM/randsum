import type { ModifierOptions, NumericRollOptions } from '@randsum/dice'
import type { RollQueryParams } from '../types'

/**
 * Parse query parameters into roll options
 *
 * @param params - Query parameters from the request
 * @returns Roll options for the dice roll
 */
export function parseQueryParams(params: RollQueryParams): NumericRollOptions {
  // If notation is provided, use it directly
  if (params.notation) {
    // For now, we'll parse the notation manually to avoid dependency loops
    // This is a simplified version that handles basic notation like "2d20"
    const match = /^(\d+)d(\d+)(.*)$/.exec(params.notation)
    if (match?.[1] && match[2]) {
      const quantity = parseInt(match[1], 10)
      const sides = parseInt(match[2], 10)

      // Basic validation
      if (isNaN(quantity) || quantity <= 0 || isNaN(sides) || sides <= 0) {
        throw new Error(`Invalid dice notation: ${params.notation}`)
      }

      return { quantity, sides }
    }
    throw new Error(`Invalid dice notation: ${params.notation}`)
  }

  // Otherwise, build options from individual parameters
  let sides = 20
  if (params.sides) {
    sides = parseInt(params.sides, 10)
  }

  let quantity = 1
  if (params.quantity) {
    quantity = parseInt(params.quantity, 10)
  }

  if (isNaN(sides) || sides <= 0) {
    throw new Error('Sides must be a positive number')
  }

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive number')
  }

  const modifiers: ModifierOptions = {}

  // Parse plus modifier
  if (params.plus) {
    const plus = parseInt(params.plus, 10)
    if (!isNaN(plus)) {
      modifiers.plus = plus
    }
  }

  // Parse minus modifier
  if (params.minus) {
    const minus = parseInt(params.minus, 10)
    if (!isNaN(minus)) {
      modifiers.minus = minus
    }
  }

  // Parse drop modifiers
  const dropOptions: Record<string, number | number[]> = {}

  if (params.drop_lowest) {
    const lowest = parseInt(params.drop_lowest, 10)
    if (!isNaN(lowest) && lowest > 0) {
      dropOptions['lowest'] = lowest
    }
  }

  if (params.drop_highest) {
    const highest = parseInt(params.drop_highest, 10)
    if (!isNaN(highest) && highest > 0) {
      dropOptions['highest'] = highest
    }
  }

  if (params.drop_exact) {
    const exact = params.drop_exact
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
    if (exact.every((v) => !isNaN(v))) {
      dropOptions['exact'] = exact
    }
  }

  if (params.drop_less_than) {
    const lessThan = parseInt(params.drop_less_than, 10)
    if (!isNaN(lessThan)) {
      dropOptions['lessThan'] = lessThan
    }
  }

  if (params.drop_greater_than) {
    const greaterThan = parseInt(params.drop_greater_than, 10)
    if (!isNaN(greaterThan)) {
      dropOptions['greaterThan'] = greaterThan
    }
  }

  if (Object.keys(dropOptions).length > 0) {
    modifiers.drop = dropOptions
  }

  // Parse reroll modifiers
  const rerollOptions: Record<string, number | number[]> = {}

  if (params.reroll_less_than) {
    const lessThan = parseInt(params.reroll_less_than, 10)
    if (!isNaN(lessThan)) {
      rerollOptions['lessThan'] = lessThan
    }
  }

  if (params.reroll_greater_than) {
    const greaterThan = parseInt(params.reroll_greater_than, 10)
    if (!isNaN(greaterThan)) {
      rerollOptions['greaterThan'] = greaterThan
    }
  }

  if (params.reroll_exact) {
    const exact = params.reroll_exact
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
    if (exact.every((v) => !isNaN(v))) {
      rerollOptions['exact'] = exact
    }
  }

  if (params.reroll_max) {
    const max = parseInt(params.reroll_max, 10)
    if (!isNaN(max) && max > 0) {
      rerollOptions['max'] = max
    }
  }

  if (Object.keys(rerollOptions).length > 0) {
    modifiers.reroll = rerollOptions
  }

  // Parse cap modifiers
  const capOptions: Record<string, number> = {}

  if (params.cap_greater_than) {
    const greaterThan = parseInt(params.cap_greater_than, 10)
    if (!isNaN(greaterThan)) {
      capOptions['greaterThan'] = greaterThan
    }
  }

  if (params.cap_less_than) {
    const lessThan = parseInt(params.cap_less_than, 10)
    if (!isNaN(lessThan)) {
      capOptions['lessThan'] = lessThan
    }
  }

  if (Object.keys(capOptions).length > 0) {
    modifiers.cap = capOptions
  }

  // Parse unique modifier
  if (params.unique === 'true') {
    modifiers.unique = true
  }

  let finalModifiers = undefined
  if (Object.keys(modifiers).length > 0) {
    finalModifiers = modifiers
  }

  // Create the final options object
  const options: NumericRollOptions = {
    sides,
    quantity
  }

  // Only add modifiers if they exist
  if (finalModifiers) {
    options.modifiers = finalModifiers
  }

  return options
}
