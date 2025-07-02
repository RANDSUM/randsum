import type { BaseD } from '../types'

export function isD(arg: unknown): arg is BaseD {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    'type' in arg &&
    'sides' in arg &&
    'faces' in arg &&
    'isCustom' in arg &&
    'roll' in arg &&
    'rollSpread' in arg &&
    'rollModified' in arg &&
    'toOptions' in arg &&
    (arg.type === 'numeric' || arg.type === 'custom')
  )
}

export function isNumericDie(die: BaseD): die is import('../types').NumericDie {
  return die.type === 'numeric'
}

export function isCustomDie(die: BaseD): die is import('../types').CustomDie {
  return die.type === 'custom'
}
