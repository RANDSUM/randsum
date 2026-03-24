import type { ComparisonOptions } from '../notation/types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation
} from '../notation/comparison'
import { validateComparisonOptions } from '../lib/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'

const capPattern = /[Cc]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const capSchema: NotationSchema<ComparisonOptions> = defineNotationSchema<ComparisonOptions>(
  {
    name: 'cap',
    priority: 10,

    pattern: capPattern,

    docs: [
      {
        key: 'C{..}',
        category: 'Clamp',
        color: '#67e8f9',
        colorLight: '#0891b2',
        title: 'Cap',
        description:
          'Clamp individual die values to a range \u2014 dice outside the boundary are moved to it.',
        displayBase: 'C{..}',
        forms: [{ notation: 'C{...}', note: 'Comma-separate multiple conditions' }],
        comparisons: [
          { operator: 'n', note: 'max cap: no result exceeds n' },
          {
            operator: '>n',
            note: 'cap: clamp anything above n down to n'
          },
          {
            operator: '>=n',
            note: 'cap: clamp n and above down to n'
          },
          {
            operator: '<n',
            note: 'floor: clamp anything below n up to n'
          },
          {
            operator: '<=n',
            note: 'floor: clamp n and below up to n'
          }
        ],
        examples: [
          {
            description: 'Cap rolls: nothing exceeds 5',
            notation: '4d6C{>5}',
            options: { sides: 6, quantity: 4, modifiers: { cap: { greaterThan: 5 } } }
          },
          {
            description: 'Clamp rolls to [3, 18]',
            notation: '4d20C{<3,>18}',
            options: {
              sides: 20,
              quantity: 4,
              modifiers: { cap: { lessThan: 3, greaterThan: 18 } }
            }
          }
        ]
      } satisfies NotationDoc
    ],

    parse: notation => {
      const match = capPattern.exec(notation)
      if (!match?.[1]) return {}

      const parsed = parseComparisonNotation(match[1])
      const cap: ComparisonOptions = {}

      if (parsed.greaterThan !== undefined) cap.greaterThan = parsed.greaterThan
      if (parsed.greaterThanOrEqual !== undefined)
        cap.greaterThanOrEqual = parsed.greaterThanOrEqual
      if (parsed.lessThan !== undefined) cap.lessThan = parsed.lessThan
      if (parsed.lessThanOrEqual !== undefined) cap.lessThanOrEqual = parsed.lessThanOrEqual
      if (parsed.exact?.length) cap.exact = parsed.exact

      return Object.keys(cap).length > 0 ? { cap } : {}
    },

    toNotation: options => {
      const capList = formatComparisonNotation(options)
      return capList.length ? `C{${capList.join(',')}}` : undefined
    },

    toDescription: options => {
      const { exact, ...comparisonOpts } = options
      const descriptions: string[] = []

      if (exact?.length) {
        descriptions.push(...exact.map(v => `No Rolls Greater Than ${v}`))
      }

      const comparison = formatComparisonDescription(comparisonOpts)
      descriptions.push(...comparison.map(str => `No Rolls ${str}`))

      return descriptions
    }
  }
)

export const capModifier: ModifierDefinition<ComparisonOptions> = {
  ...capSchema,

  apply: (rolls, options) => {
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } = options
    const newRolls = rolls.map(roll => {
      const afterHighCap =
        greaterThan !== undefined && roll > greaterThan
          ? greaterThan
          : greaterThanOrEqual !== undefined && roll >= greaterThanOrEqual
            ? greaterThanOrEqual
            : roll

      // Gap 41: C{N} (bare integer) is parsed as `exact: [N]` internally.
      // Despite the name "exact", the apply logic here implements max-cap semantics:
      // clamp DOWN to `cap` if v > cap. This is correct behavior for "no result exceeds N".
      // The `exact` representation is an internal detail; consumers should treat C{N} as a ceiling cap.
      const afterExactCap = (exact ?? []).reduce((v, cap) => (v > cap ? cap : v), afterHighCap)

      const afterLowCap =
        lessThan !== undefined && afterExactCap < lessThan
          ? lessThan
          : lessThanOrEqual !== undefined && afterExactCap <= lessThanOrEqual
            ? lessThanOrEqual
            : afterExactCap

      return afterLowCap
    })

    return { rolls: newRolls }
  },

  validate: options => {
    validateComparisonOptions('cap', options)
  }
}
