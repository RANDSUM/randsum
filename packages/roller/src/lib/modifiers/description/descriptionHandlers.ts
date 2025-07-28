import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../../types'
import { formatComparisonDescription, formatHumanList } from '../../comparisonUtils'
import { FORMAT_STRINGS } from '../../constants'
import { formatDropDescription } from './formatDropDescription'
import { formatRerollDescription } from './formatRerollDescription'
import { formatReplaceDescription } from './formatReplaceDescription'
import type { DescriptionHandler } from '../types'

export const DESCRIPTION_HANDLERS: ReadonlyMap<keyof ModifierOptions, DescriptionHandler> = new Map<
  keyof ModifierOptions,
  DescriptionHandler
>([
  ['plus', options => [FORMAT_STRINGS.ADD(options as number)]],
  ['minus', options => [FORMAT_STRINGS.SUBTRACT(options as number)]],
  [
    'cap',
    options =>
      formatComparisonDescription(options as ComparisonOptions).map(str =>
        FORMAT_STRINGS.NO_ROLLS(str)
      )
  ],
  ['drop', options => formatDropDescription(options as DropOptions)],
  ['reroll', options => formatRerollDescription(options as RerollOptions)],
  ['explode', () => [FORMAT_STRINGS.EXPLODING_DICE]],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') {
        return [FORMAT_STRINGS.NO_DUPLICATES]
      }
      return [
        FORMAT_STRINGS.NO_DUPLICATES_EXCEPT(formatHumanList((options as UniqueOptions).notUnique))
      ]
    }
  ],
  ['replace', options => formatReplaceDescription(options as ReplaceOptions | ReplaceOptions[])]
])
