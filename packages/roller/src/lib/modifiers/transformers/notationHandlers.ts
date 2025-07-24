import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../../types'
import { formatComparisonNotation } from '../../comparisonUtils'
import { formatDropNotation } from './formatDropNotation'
import { formatRerollNotation } from './formatRerollNotation'
import { formatReplaceNotation } from './formatReplaceNotation'
import type { NotationHandler } from '../types'

export const NOTATION_HANDLERS: ReadonlyMap<keyof ModifierOptions, NotationHandler> = new Map<
  keyof ModifierOptions,
  NotationHandler
>([
  [
    'plus',
    options => {
      const numOptions = options as number
      if (numOptions < 0) {
        return `-${Math.abs(numOptions)}`
      }
      return `+${numOptions}`
    }
  ],
  ['minus', options => `-${options as number}`],
  [
    'cap',
    options => {
      const capList = formatComparisonNotation(options as ComparisonOptions)
      return capList.length ? `C{${capList.join(',')}}` : undefined
    }
  ],
  ['drop', options => formatDropNotation(options as DropOptions)],
  ['reroll', options => formatRerollNotation(options as RerollOptions)],
  ['explode', () => '!'],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') return 'U'
      return `U{${(options as UniqueOptions).notUnique.join(',')}}`
    }
  ],
  ['replace', options => formatReplaceNotation(options as ReplaceOptions | ReplaceOptions[])]
])
