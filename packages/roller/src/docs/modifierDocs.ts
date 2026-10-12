import { RANDSUM_DICE_SCHEMAS } from '../dice/index'
import { MODIFIER_NOTATION_DOCS } from './modifierDocData'
import type { ModifierCategory } from '../notation/tokenize'
import type { RollOptions } from '../notation/types'

export type { ModifierCategory }

export interface NotationDoc {
  readonly key: string
  readonly category: ModifierCategory
  readonly title: string
  readonly description: string
  readonly displayBase: string
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

const diceEntries: readonly [string, NotationDoc][] = RANDSUM_DICE_SCHEMAS.map(schema => [
  schema.doc.key,
  schema.doc
])

const modifierEntries: readonly [string, NotationDoc][] = MODIFIER_NOTATION_DOCS.map(
  doc => [doc.key, doc] as [string, NotationDoc]
)

// Notation that is neither a die nor a modifier: the parser directive and the
// metadata feature (RDN glossary). `tokenize` emits these keys, so they need docs
// for the token overlay to colour them; they stay out of MODIFIER_DOCS / DICE_DOCS.
const syntaxDocs: readonly NotationDoc[] = [
  {
    key: 'xN',
    category: 'Special',
    color: '#a5b4fc',
    colorLight: '#4338ca',
    title: 'Repeat',
    description:
      'Evaluate the whole expression N times, each with its own pool and total. Resolved at parse time.',
    displayBase: 'xN',
    forms: [{ notation: '4d6Lx6', note: 'Repeat the preceding expression N times' }],
    examples: [{ description: 'Six ability scores', notation: '4d6Lx6' }]
  },
  {
    key: 'label',
    category: 'Special',
    color: '#a1a1aa',
    colorLight: '#52525b',
    title: 'Annotation',
    description: 'Attach a label to an expression. Annotations never change the roll.',
    displayBase: '[text]',
    forms: [{ notation: '2d6[fire]', note: 'Label the expression; the text is display-only' }],
    examples: [{ description: 'Label fire damage', notation: '2d6+3[fire]' }]
  }
]

const syntaxEntries: readonly [string, NotationDoc][] = syntaxDocs.map(doc => [doc.key, doc])

export const NOTATION_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries([...diceEntries, ...modifierEntries, ...syntaxEntries])
)

export const MODIFIER_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(modifierEntries)
)

export const DICE_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(diceEntries)
)
