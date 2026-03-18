import { RANDSUM_MODIFIERS } from '../modifiers/definitions'
import { RANDSUM_DICE_SCHEMAS } from '../dice/index'

export interface NotationDoc {
  readonly key: string
  readonly category: string
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
    readonly notation: string
    readonly description: string
  }[]
}

export type ModifierDoc = NotationDoc

const diceEntries: readonly [string, NotationDoc][] = RANDSUM_DICE_SCHEMAS.map(schema => [
  schema.doc.key,
  schema.doc
])

const modifierEntries: readonly [string, NotationDoc][] = RANDSUM_MODIFIERS.flatMap(mod =>
  (mod.docs ?? []).map(doc => [doc.key, doc] as [string, NotationDoc])
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
