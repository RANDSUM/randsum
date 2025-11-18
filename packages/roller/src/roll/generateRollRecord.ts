import { RollParameters, IndividualRoll, NumericRollBonus } from '../types';
import { coreSpreadRolls, coreRandom } from '../lib/random';
import { applyModifiers } from '../lib/modifiers';

export const generateRollRecord = (parameters: RollParameters): IndividualRoll => {
  const { sides, quantity = 1, modifiers = {} } = parameters;
  const isCustom = Array.isArray(sides);
  const sideCount = isCustom ? sides.length : (sides as number);
  
  const initialRolls = coreSpreadRolls(quantity, sideCount);
  
  let bonus: NumericRollBonus = {
    rolls: initialRolls,
    simpleMathModifier: 0,
    logs: []
  };
  
  const rollOne = () => coreRandom(sideCount) + 1;

  // Order of operations
  const ORDER = ['explode', 'reroll', 'replace', 'unique', 'cap', 'drop', 'plus', 'minus'];
  
  ORDER.forEach(key => {
    // @ts-ignore
    if (modifiers[key] !== undefined) {
      // @ts-ignore
      bonus = applyModifiers(key, modifiers[key], bonus, parameters, rollOne);
    }
  });

  const total = bonus.rolls.reduce((a, b) => a + b, 0) + bonus.simpleMathModifier;

  return {
    total,
    rolls: bonus.rolls,
    parameters,
    modifierHistory: {
      initialRolls,
      modifiedRolls: bonus.rolls,
      total,
      logs: bonus.logs
    }
  };
};
