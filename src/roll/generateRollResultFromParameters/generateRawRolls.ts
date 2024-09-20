import { DicePools, RandsumRollResult } from '~types'

function generateRawRolls(
  dicePools: DicePools['dicePools']
): RandsumRollResult['rawRolls'] {
  return Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const {
        die,
        options: { quantity }
      } = dicePools[key]
      const rolls = Array.from(
        {
          length: quantity || 1
        },
        () => die.roll()
      ) as string[] | number[]
      return [key, rolls]
    })
  )
}

export { generateRawRolls }
