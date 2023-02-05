import { DiceNotation, RollParameters } from '../types'
import parseModifiers, {
  isCoreNotationMatch,
  Match,
  parseCoreNotation
} from './parse-modifiers'
import { completeRollPattern } from './regexp'

const findMatches = (notations: string): Match[] =>
  [...notations.matchAll(completeRollPattern)].map<Match>(
    ({ groups: match }) => match as Match
  )

const parseNotation = (notationString: DiceNotation): RollParameters => {
  let rollParameters: RollParameters = {
    sides: 1,
    quantity: 1,
    faces: undefined,
    modifiers: [],
    initialRolls: []
  }

  findMatches(notationString).forEach((match) => {
    const { modifiers, ...restParameters } = rollParameters

    if (isCoreNotationMatch(match)) {
      const newRollParameters = {
        ...rollParameters,
        ...parseCoreNotation(match)
      }
      if (newRollParameters.faces !== undefined) {
        rollParameters = { ...newRollParameters, modifiers: [] }
      }
      rollParameters = newRollParameters
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
