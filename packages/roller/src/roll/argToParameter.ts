import { RollArgument, RollParameters } from '../types';
import { validateNotation } from '../validateNotation';
import { optionsToDescription, optionsToNotation } from '../lib/transformers';

export const argToParameter = (arg: RollArgument): RollParameters[] => {
  let params: RollParameters[] = [];
  
  if (typeof arg === 'number') {
    params = [{ sides: arg, quantity: 1 }];
  } else if (typeof arg === 'string') {
    const validation = validateNotation(arg);
    if (validation.valid) {
      // If multiple options, we map them.
      // But wait, if I pass "1d20+2d6", I get 2 options.
      // Does argToParameter return 2 params?
      // Yes, returns RollParameters[].
      params = validation.options;
    }
  } else if (typeof arg === 'object') {
    params = [{ quantity: 1, ...arg }];
  }
  
  return params.map(p => ({
    ...p,
    description: optionsToDescription(p),
    notation: optionsToNotation(p),
    // argument: arg // Tests expect 'argument' field matching input? 
    // Actually test expectations show "argument": 2 or "argument": "4d6".
    // But for multi-dice string, it splits.
    // "argument": "1d20+2d6-1d8" in ALL of them?
    // Yes.
    argument: arg as any
  }));
};
