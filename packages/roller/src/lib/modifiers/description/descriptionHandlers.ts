import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../../types'
import { formatComparisonDescription, formatHumanList } from '../../comparisonUtils'
import { formatDropDescription } from './formatDropDescription'
import { formatRerollDescription } from './formatRerollDescription'
import { formatReplaceDescription } from './formatReplaceDescription'
import type { DescriptionHandler } from '../types'

export const DESCRIPTION_HANDLERS: ReadonlyMap<keyof ModifierOptions, DescriptionHandler> = new Map<
  keyof ModifierOptions,
  DescriptionHandler
>([
  ['plus', options => [`Add ${options as number}`]],
  ['minus', options => [`Subtract ${options as number}`]],
  [
    'cap',
    options =>
      formatComparisonDescription(options as ComparisonOptions).map(str => `No Rolls ${str}`)
  ],
  ['drop', options => formatDropDescription(options as DropOptions)],
  ['reroll', options => formatRerollDescription(options as RerollOptions)],
  ['explode', () => ['Exploding Dice']],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') {
        return ['No Duplicate Rolls']
      }
      return [`No Duplicates (except ${formatHumanList((options as UniqueOptions).notUnique)})`]
    }
  ],
  ['replace', options => formatReplaceDescription(options as ReplaceOptions | ReplaceOptions[])]
])
