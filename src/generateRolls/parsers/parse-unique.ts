import { RollDie, RollParameters, RollTotals } from 'types'

export function parseUniqueFactory({ unique, rolls, sides }: RollParameters, rollDie: RollDie) {
  return function parseUnique(rollTotals: RollTotals) {
    if (rolls > sides) {
      throw new Error('You cannot have unique rolls when there are more rolls than sides of die.')
    }
    const notUnique = !unique || typeof unique === 'boolean' ? [] : unique.notUnique

    const filteredArray = new Set(rollTotals.filter(n => !notUnique.includes(n)))
    const fixedRollTotals = rollTotals.map((number_, index, array) => {
      let roll
      switch (true) {
        case array.indexOf(number_) === index:
        case notUnique.includes(number_):
          return number_
        default:
          do {
            roll = rollDie()
          } while (filteredArray.has(roll))
          return roll
      }
    })

    return fixedRollTotals
  }
}
