import {
  CustomSidesDie,
  InternalRollParameters,
  RollResult,
  StandardDie
} from 'types'
import {
  isCapModifier,
  isDropModifier,
  isExplodeModifier,
  isMinusModifier,
  isPlusModifier,
  isReplaceModifier,
  isRerollModifier,
  isUniqueModifier
} from 'utils'

import applyDrop from './applicators/apply-drop'
import applyExplode from './applicators/apply-explode'
import applyReplace from './applicators/apply-replace'
import applyReroll from './applicators/apply-reroll'
import applySingleCap from './applicators/apply-single-cap'
import applyUnique from './applicators/apply-unique'
import generateRolls from './generate-rolls'
import generateTotalAndRolls from './generate-total-and-rolls'

export default function generateResult(
  { sides, quantity, modifiers, randomizer, faces }: InternalRollParameters,
  rollGenerator = generateRolls
):
  | Omit<RollResult<StandardDie>, 'arguments'>
  | Omit<RollResult<CustomSidesDie>, 'arguments'> {
  const { rollOne, initialRolls } = rollGenerator(sides, quantity, randomizer)

  const rollBonuses = {
    simpleMathModifier: 0,
    rolls: initialRolls
  }

  // eslint-disable-next-line unicorn/no-array-reduce
  const modifiedRollBonuses = modifiers.reduce((accumulator, modifier) => {
    if (isRerollModifier(modifier)) {
      return {
        ...accumulator,
        rolls: applyReroll(accumulator.rolls, modifier.reroll, rollOne)
      }
    }

    if (isUniqueModifier(modifier)) {
      return {
        ...accumulator,
        rolls: applyUnique(
          accumulator.rolls,
          { sides, quantity, unique: modifier.unique },
          rollOne
        )
      }
    }

    if (isReplaceModifier(modifier)) {
      return {
        ...accumulator,
        rolls: applyReplace(accumulator.rolls, modifier.replace)
      }
    }

    if (isCapModifier(modifier)) {
      return {
        ...accumulator,
        rolls: accumulator.rolls.map(applySingleCap(modifier.cap))
      }
    }

    if (isDropModifier(modifier)) {
      return {
        ...accumulator,
        rolls: applyDrop(accumulator.rolls, modifier.drop)
      }
    }

    if (isExplodeModifier(modifier)) {
      return {
        ...accumulator,
        rolls: applyExplode(accumulator.rolls, { sides }, rollOne)
      }
    }

    if (isPlusModifier(modifier)) {
      return {
        ...accumulator,
        simpleMathModifier:
          accumulator.simpleMathModifier + Number(modifier.plus)
      }
    }

    if (isMinusModifier(modifier)) {
      return {
        ...accumulator,
        simpleMathModifier:
          accumulator.simpleMathModifier - Number(modifier.minus)
      }
    }
    throw new Error('Unrecognized Modifier')
  }, rollBonuses)

  return {
    ...generateTotalAndRolls({ faces, ...modifiedRollBonuses }),
    rollParameters: {
      sides,
      quantity,
      modifiers,
      initialRolls,
      faces,
      randomizer,
      rollOne
    }
  }
}
