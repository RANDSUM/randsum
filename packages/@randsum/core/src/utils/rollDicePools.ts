import type { DicePoolLike, DicePoolRollReturn } from '../types'

export function rollDicePools<R>(
  dicePools: DicePoolLike<R>
): DicePoolRollReturn<R> {
  return Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const {
        die,
        config: { quantity }
      } = dicePools[key]
      return [key, die.rollMany(quantity)]
    })
  )
}
