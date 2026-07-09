import type { ParsedNotationOptions, RollOptions } from '../types'
import { modifiersToDescription } from './modifiersToStrings'
import { optionsToSidesFaces } from './optionsToSidesFaces'

/**
 * The special-die discriminants a parsed pool may carry. Present only when the
 * options came from `notationToOptions` for a special die; absent for plain
 * `RollOptions`. Read so that `validateNotation` describes a special die with its
 * own semantics (e.g. `4dF` -> "Roll 4dF") instead of a generic sides count —
 * matching the description `roll()` emits for the same notation, so the two public
 * surfaces stay unified.
 */
type SpecialDiscriminants = Partial<
  Pick<ParsedNotationOptions, 'dieType' | 'fateVariant' | 'customFaces'>
>

/**
 * Render the special-die core line, mirroring the string `roll()` produces in
 * `parseArguments.specialOptionsToParams`. Returns null for standard and
 * percentile pools: percentile is genuinely d100, so the generic
 * "Roll 1 100-sided die" is already correct, and standard pools have no special
 * semantics to surface.
 */
function specialCoreDescription(
  quantity: number,
  sides: number,
  special: SpecialDiscriminants
): string | null {
  switch (special.dieType) {
    case 'fate':
      return `Roll ${quantity}dF${special.fateVariant === 2 ? '.2' : ''}`
    case 'zeroBias':
      return `Roll ${quantity}z${sides}`
    case 'custom':
      return `Roll ${quantity}d{${(special.customFaces ?? []).join(',')}}`
    case 'draw':
      return `Draw ${quantity} from d${sides}`
    case 'geometric':
      return `Roll g${sides} (geometric: roll d${sides} until 1)`
    default:
      return null
  }
}

/**
 * Converts roll options to a human-readable description.
 *
 * @template T - Type for custom dice faces
 * @param options - Roll options to describe
 * @returns Array of description strings
 */
export function optionsToDescription<T = string>(
  options: RollOptions<T> & SpecialDiscriminants
): string[] {
  const { modifiers, quantity = 1, arithmetic } = options
  const { sides, faces = [] } = optionsToSidesFaces(options)

  // Special dice reject modifiers (a special die carrying a modifier never reaches
  // here — it degrades to a plain pool upstream), so their description is the lone
  // special-die core line, exactly as `roll()` renders it.
  const specialCore = specialCoreDescription(quantity, sides, options)
  if (specialCore !== null) return [specialCore]

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
