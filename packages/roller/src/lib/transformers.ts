import { RollOption } from '../types';
import { modifierToDescription, modifierToNotation } from '../modifiers';

export const optionsToDescription = (option: RollOption): string[] => {
  const parts = [`Roll ${option.quantity} ${option.sides}-sided ${option.quantity === 1 ? 'die' : 'dice'}`];
  if (option.arithmetic === 'subtract') {
    parts.push('and Subtract the result');
  }
  
  const m = option.modifiers;
  if (m) {
    Object.keys(m).forEach(key => {
       const desc = modifierToDescription(key, m[key as keyof typeof m]);
       if (desc) parts.push(...desc);
    });
  }
  
  return parts;
};

export const optionsToNotation = (option: RollOption): string => {
  // This is a best-effort reconstruction
  const { quantity = 1, sides, modifiers = {}, arithmetic } = option;
  let str = `${quantity}d${sides}`;
  
  if (arithmetic === 'subtract') {
    str = `-${str}`;
  }
  
  if (modifiers) {
    // Order matters for notation? 
    // Usually: modifiers attached to the die roll.
    // plus/minus at end.
    
    // Helper for modifiers
    const append = (key: string) => {
       // @ts-ignore
       const notation = modifierToNotation(key, modifiers[key]);
       if (notation) str += notation;
    };
    
    // Specific order
    ['explode', 'reroll', 'replace', 'unique', 'cap', 'drop'].forEach(append);
    
    // plus/minus
    ['plus', 'minus'].forEach(append);
  }
  
  return str;
};

