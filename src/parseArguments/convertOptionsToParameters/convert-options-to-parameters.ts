import { UserOptions } from '../..'
import { InternalRollParameters, RandsumOptions, RandsumOptionsWithoutSides } from '../../types'
import { normalizeModifiers } from './normalize-modifiers'

const defaultRollParameters: InternalRollParameters = {
  quantity: 1,
  sides: 20,
  modifiers: [],
  randomizer: undefined,
}

export function convertOptionsToParameters<D extends boolean>({
  detailed,
  ...restOptions
}: RandsumOptions<D> | RandsumOptionsWithoutSides<D> | UserOptions<D>): [D, InternalRollParameters] {
  const { quantity, sides, modifiers, ...restParsedOptions } = {
    ...defaultRollParameters,
    ...restOptions,
  }

  if (detailed === undefined) {
    detailed = false
  }

  return [
    detailed,
    {
      sides: Number(sides),
      quantity: Number(quantity),
      modifiers: normalizeModifiers(modifiers),
      ...restParsedOptions,
    },
  ]
}
