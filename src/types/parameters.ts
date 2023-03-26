import { CustomSidesDie, StandardDie } from '../Die'
import { Modifier, RollOptions } from './options'
import { DiceNotation, DieSides, NumberString } from './primitives'

export type DiceParameters<T extends DieSides> = {
  quantity: number
  sides: T extends number ? number : string[]
}

export type RollParameters<T extends DieSides> = {
  argument: RollOptions<T> | DiceNotation<T> | NumberString | undefined
  diceOptions: DiceParameters<T>[]
  initialRolls: T[]
  modifiers: Array<Modifier<number>>
  dice: (T extends number ? StandardDie : CustomSidesDie)[]
}
