import { RollOptions, RollParameters, UserOptions } from 'types'

import { convertCapOptionsToParameters } from './convert-cap-options-to-parameters'
import { convertDropOptionsToParameters } from './convert-drop-options-to-parameters'
import { convertReplaceOptionsToParameters } from './convert-replace-options-to-parameters'
import { convertRerollOptionsToParameters } from './convert-reroll-options-to-parameters'

export function convertOptionsToParameters({
  rolls,
  plus,
  minus,
  sides,
  cap,
  drop,
  replace,
  reroll,
  unique,
  ...restOptions
}: Partial<RollOptions & UserOptions>): Partial<RollParameters> & UserOptions {
  let rollParameters: Partial<RollParameters> = { ...restOptions }

  if (rolls !== undefined) {
    rollParameters = { ...rollParameters, rolls: Number(rolls) }
  }

  if (sides !== undefined) {
    rollParameters = { ...rollParameters, sides: Number(sides) }
  }

  if (plus !== undefined) {
    rollParameters = { ...rollParameters, plus: Number(plus) }
  }

  if (minus !== undefined) {
    rollParameters = { ...rollParameters, minus: Number(minus) }
  }

  if (cap !== undefined) {
    rollParameters = { ...rollParameters, cap: convertCapOptionsToParameters(cap) }
  }

  if (drop !== undefined) {
    rollParameters = { ...rollParameters, drop: convertDropOptionsToParameters(drop) }
  }

  if (replace !== undefined) {
    rollParameters = {
      ...rollParameters,
      replace: Array.isArray(replace)
        ? replace.map(option => convertReplaceOptionsToParameters(option))
        : convertReplaceOptionsToParameters(replace),
    }
  }

  if (reroll !== undefined) {
    rollParameters = {
      ...rollParameters,
      reroll: Array.isArray(reroll)
        ? reroll.map(option => convertRerollOptionsToParameters(option))
        : convertRerollOptionsToParameters(reroll),
    }
  }

  if (unique !== undefined) {
    rollParameters = {
      ...rollParameters,
      unique: typeof unique === 'object' ? { notUnique: unique.notUnique.map(number => Number(number)) } : unique,
    }
  }

  return rollParameters
}
