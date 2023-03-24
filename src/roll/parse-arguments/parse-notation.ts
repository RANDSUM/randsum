import { completeRollPattern } from '../../constants/regexp'
import { CustomSidesDicePool, StandardDicePool } from '../../Die'
import { isCustomSidesRollParameters } from '../../types/guards'
import { Modifier } from '../../types/options'
import { RollParameters } from '../../types/parameters'
import { DiceNotation } from '../../types/primitives'
import { generateStandardSides } from '../../utils'
import parseModifiers, {
  isCoreNotationMatch,
  Match,
  parseCoreNotation
} from './parse-modifiers'

const findMatches = (notations: string): Match[] =>
  [...notations.matchAll(completeRollPattern)].map<Match>(
    ({ groups: match }) => match as Match
  )

const parseNotation = (
  notationString: DiceNotation | DiceNotation<string>
): RollParameters | RollParameters<string> => {
  let rollParameters: RollParameters | RollParameters<string> = {
    pool: new StandardDicePool([]),
    argument: notationString,
    faces: [],
    dice: [],
    sides: 1,
    quantity: 1,
    modifiers: [] as Modifier<number>[],
    initialRolls: []
  }

  findMatches(notationString).forEach((match) => {
    const { modifiers, ...restParameters } = rollParameters

    if (isCoreNotationMatch(match)) {
      const newRollParameters = {
        ...rollParameters,
        ...parseCoreNotation(match)
      }
      if (isCustomSidesRollParameters(newRollParameters)) {
        const dice = [
          {
            quantity: newRollParameters.quantity,
            sides: newRollParameters.faces
          }
        ]
        const pool = new CustomSidesDicePool(dice)
        const initialRolls = pool.roll()
        rollParameters = {
          ...newRollParameters,
          dice,
          pool,
          initialRolls,
          modifiers: []
        }
      } else {
        const dice = [
          {
            quantity: newRollParameters.quantity,
            sides: newRollParameters.sides
          }
        ]
        const pool = new StandardDicePool(dice)
        const initialRolls = pool.roll()

        rollParameters = {
          ...newRollParameters,
          dice,
          pool,
          faces: generateStandardSides(newRollParameters.sides),
          initialRolls
        }
      }
      return
    }

    rollParameters = {
      ...restParameters,
      modifiers: [...modifiers, parseModifiers(match)]
    }
  })

  return rollParameters
}

export default parseNotation
