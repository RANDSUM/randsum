import { RollArgument, RollResult, RollOption, IndividualRoll } from '../types';
import { generateRollRecord } from './generateRollRecord';
import { argToParameter } from './argToParameter';

export const roll = (...args: RollArgument[]): RollResult => {
  const options: RollOption[] = [];
  
  args.forEach(arg => {
    options.push(...argToParameter(arg));
  });

  let grandTotal = 0;
  const rollLogs: IndividualRoll[] = [];
  const allResults: any[] = [];

  options.forEach(option => {
    const record = generateRollRecord(option);
    
    let optionTotal = record.total;
    if (option.arithmetic === 'subtract') {
      grandTotal -= optionTotal;
    } else {
      grandTotal += optionTotal;
    }

    rollLogs.push(record);
    
    if (Array.isArray(option.sides)) {
      const faces = option.sides;
      record.rolls.forEach(val => {
         if (val >= 1 && val <= faces.length) {
            allResults.push(faces[val - 1]);
         } else {
            allResults.push(undefined); 
         }
      });
    }
  });

  return {
    total: grandTotal,
    rolls: rollLogs,
    result: allResults
  };
};
