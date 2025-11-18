import { NumericRollBonus, RollParameters, ModifierLog } from '../../types';

export const applyModifiers = (
  modifierName: string,
  options: any,
  bonus: NumericRollBonus,
  context?: RollParameters,
  rollOne?: () => number
): NumericRollBonus => {
  const newBonus: NumericRollBonus = {
    ...bonus,
    rolls: [...bonus.rolls],
    logs: [...bonus.logs]
  };

  if (options === undefined) return bonus;

  const log: ModifierLog = {
    modifier: modifierName,
    options,
    added: [],
    removed: []
  };
  let hasChange = false;
  const alwaysLog = ['drop', 'cap', 'reroll', 'unique', 'replace', 'explode'].includes(modifierName);

  switch (modifierName) {
    case 'plus':
      newBonus.simpleMathModifier += options;
      return newBonus;
    case 'minus':
      newBonus.simpleMathModifier -= options;
      return newBonus;
      
    case 'cap': {
      const { greaterThan, lessThan } = options;
      newBonus.rolls = newBonus.rolls.map(r => {
        if (greaterThan !== undefined && r > greaterThan) {
          hasChange = true;
          log.removed!.push(r);
          log.added!.push(greaterThan);
          return greaterThan;
        }
        if (lessThan !== undefined && r < lessThan) {
          hasChange = true;
          log.removed!.push(r);
          log.added!.push(lessThan);
          return lessThan;
        }
        return r;
      });
      break;
    }

    case 'drop': {
      const { lowest, highest, greaterThan, lessThan, exact } = options;
      let currentRolls = [...newBonus.rolls];
      const droppedValues: number[] = [];
      
      // 1. Value Filters
      currentRolls = currentRolls.filter(r => {
        let drop = false;
        if (greaterThan !== undefined && r > greaterThan) drop = true;
        if (lessThan !== undefined && r < lessThan) drop = true;
        if (exact && exact.includes(r)) drop = true;
        
        if (drop) {
          droppedValues.push(r);
          return false;
        }
        return true;
      });
      
      // 2. Lowest
      if (lowest) {
         const sorted = [...currentRolls].sort((a, b) => a - b);
         const toDrop = sorted.slice(0, lowest);
         toDrop.forEach(val => {
            const idx = currentRolls.indexOf(val);
            if (idx > -1) {
               droppedValues.push(currentRolls[idx]);
               currentRolls.splice(idx, 1);
            }
         });
      }

      // 3. Highest
      if (highest) {
         const sorted = [...currentRolls].sort((a, b) => b - a);
         const toDrop = sorted.slice(0, highest);
         toDrop.forEach(val => {
            const idx = currentRolls.indexOf(val);
            if (idx > -1) {
               droppedValues.push(currentRolls[idx]);
               currentRolls.splice(idx, 1);
            }
         });
      }

      if (droppedValues.length > 0) {
         hasChange = true;
         // Sort removed values for test consistency
         log.removed = droppedValues.sort((a, b) => a - b);
         newBonus.rolls = currentRolls;
      }
      
      // Sort result if dropped
      if (lowest || highest) {
        newBonus.rolls.sort((a, b) => a - b);
      }
      break;
    }

    case 'reroll': {
      if (!rollOne) throw new Error('rollOne function required for reroll modifier');
      const { greaterThan, lessThan, exact, max } = options;
      const maxDice = max !== undefined ? max : 999999;
      let diceRerolledCount = 0;

      newBonus.rolls = newBonus.rolls.map(r => {
        let val = r;
        let attempts = 0;
        let rerolled = false;
        
        let should = false;
        if (exact && exact.includes(val)) should = true;
        if (greaterThan !== undefined && val > greaterThan) should = true;
        if (lessThan !== undefined && val < lessThan) should = true;

        if (should) {
           if (diceRerolledCount < maxDice) {
              rerolled = true;
              diceRerolledCount++;
              log.removed!.push(val);
              
              while (attempts < 99) {
                 val = rollOne();
                 attempts++;
                 
                 let retry = false;
                 if (exact && exact.includes(val)) retry = true;
                 if (greaterThan !== undefined && val > greaterThan) retry = true;
                 if (lessThan !== undefined && val < lessThan) retry = true;
                 
                 if (!retry) break;
              }
              log.added!.push(val);
              hasChange = true;
           }
        }
        return val;
      });
      break;
    }

    case 'explode': {
      if (!rollOne || !context) throw new Error('rollOne and context required for explode modifier');
      const maxVal = typeof context.sides === 'number' ? context.sides : context.sides.length;
      
      let i = 0;
      while (i < newBonus.rolls.length) {
        const val = newBonus.rolls[i];
        if (val === maxVal) {
           hasChange = true;
           const newVal = rollOne();
           newBonus.rolls.push(newVal);
           log.added!.push(newVal);
        }
        i++;
      }
      break;
    }

    case 'unique': {
      if (!rollOne || !context) throw new Error('rollOne and context required for unique modifier');
      const { notUnique = [] } = (typeof options === 'object' ? options : {});
      const maxVal = typeof context.sides === 'number' ? context.sides : context.sides.length;
      
      if (newBonus.rolls.length > maxVal && notUnique.length === 0) {
         throw new Error('Cannot have more rolls than sides when unique is enabled');
      }

      const seen = new Set<number>();
      newBonus.rolls = newBonus.rolls.map(r => {
         let val = r;
         let attempts = 0;
         const isAllowedDup = notUnique.includes(val);
         
         if (seen.has(val) && !isAllowedDup) {
            hasChange = true;
            log.removed!.push(val);
            
            while (seen.has(val) && !notUnique.includes(val) && attempts < 100) {
               val = rollOne();
               attempts++;
            }
            log.added!.push(val);
         }
         
         seen.add(val);
         return val;
      });
      break;
    }

    case 'replace': {
      const rules = Array.isArray(options) ? options : [options];
      newBonus.rolls = newBonus.rolls.map(r => {
         let val = r;
         let replaced = false;
         
         for (const rule of rules) {
            const { from, to } = rule;
            let match = false;
            if (typeof from === 'number') {
               if (val === from) match = true;
            } else {
               if (from.greaterThan !== undefined && val > from.greaterThan) match = true;
               if (from.lessThan !== undefined && val < from.lessThan) match = true;
            }
            
            if (match) {
               hasChange = true;
               if (!replaced) {
                 log.removed!.push(val);
                 replaced = true;
               }
               val = to;
            }
         }
         if (replaced) log.added!.push(val);
         return val;
      });
      break;
    }
  }

  if (hasChange || alwaysLog) {
    newBonus.logs.push(log);
  }
  
  return newBonus;
};
