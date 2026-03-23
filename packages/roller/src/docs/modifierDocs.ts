import { RANDSUM_DICE_SCHEMAS } from '../dice/index'
import { MODIFIER_DOC_ENTRIES } from './modifierDocEntries'
import type { ModifierCategory } from '../notation/tokenize'
import type { RollOptions } from '../notation/types'

export type { ModifierCategory }

export interface NotationDoc {
  readonly key: string
  readonly category: ModifierCategory
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly color: string
  readonly colorLight: string
  readonly forms: readonly {
    readonly notation: string
    readonly note: string
  }[]
  readonly comparisons?: readonly {
    readonly operator: string
    readonly note: string
  }[]
  readonly examples: readonly {
    readonly description: string
    readonly notation: string
    readonly options?: RollOptions<string | number>
  }[]
}

export type ModifierDoc = NotationDoc

const diceEntries: readonly [string, NotationDoc][] = RANDSUM_DICE_SCHEMAS.map(schema => [
  schema.doc.key,
  schema.doc
])

const modifierEntries: readonly [string, NotationDoc][] = MODIFIER_DOC_ENTRIES.map(
  doc => [doc.key, doc] as [string, NotationDoc]
)

export const NOTATION_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries([...diceEntries, ...modifierEntries])
)

export const MODIFIER_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(modifierEntries)
)

export const DICE_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(diceEntries)
)
