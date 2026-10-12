import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import type { ModifierOptions } from '../../src/notation/types'

/** The modifier options the parser builds for a notation's first pool. */
export function modifiersOf(notation: string): ModifierOptions {
  return notationToOptions(notation)[0]?.modifiers ?? {}
}
