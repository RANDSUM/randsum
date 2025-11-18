import { RollOption, RollModifiers } from './types';
import { isDiceNotation } from './isDiceNotation';

export interface ValidationResult {
  valid: boolean;
  options: RollOption[];
  notation: string[];
  description: string[];
  errors?: string[];
}

export const validateNotation = (notation: string): ValidationResult => {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      options: [],
      notation: [],
      description: [],
      errors: ['Invalid notation']
    };
  }

  const options: RollOption[] = [];
  const normalizedNotations: string[] = [];
  const descriptions: string[] = [];

  // Regex to split into dice terms.
  // We need to be careful about splitting because of the modifiers.
  // But since we know it's valid, we can match valid terms.
  
  const termPattern = /([+-]?)\s*(\d+)[dD](\d+)((?:\s*(?:[LH](?:\d+)?|!|U(?:\{[^}]+\})?|[RCV]\{[^}]+\}|[+-]\s*\d+(?![dD])))*)/g;
  
  let match;
  while ((match = termPattern.exec(notation)) !== null) {
    const sign = match[1] || '+';
    const quantityStr = match[2];
    const sidesStr = match[3];
    const modifiersStr = match[4];

    const quantity = parseInt(quantityStr, 10);
    const sides = parseInt(sidesStr, 10);
    
    const currentOption: RollOption = {
      sides,
      quantity: quantity, // will adjust for sign later? No, sign is separate or usually part of quantity?
      // In randsum, subtraction usually means negative quantity or 'subtract' arithmetic.
      // RollOption has `arithmetic`.
    };
    
    if (sign.includes('-')) {
      currentOption.arithmetic = 'subtract';
    }

    // Parse modifiers
    const modifiers: RollModifiers = {};
    let hasModifiers = false;

    if (modifiersStr && modifiersStr.trim()) {
      // Parse modifiersStr
      const modPattern = /([LH](?:\d+)?)|(!)|(U(?:\{[^}]+\})?)|([RCV]\{[^}]+\})|([+-]\s*\d+)/g;
      let modMatch;
      while ((modMatch = modPattern.exec(modifiersStr)) !== null) {
        hasModifiers = true;
        const [full, drop, explode, unique, complex, arithmetic] = modMatch;

        if (drop) {
          const type = drop.startsWith('L') ? 'lowest' : 'highest';
          const val = drop.length > 1 ? parseInt(drop.slice(1), 10) : 1;
          modifiers.drop = { ...modifiers.drop, [type]: val };
        } else if (explode) {
          modifiers.explode = true;
        } else if (unique) {
          if (unique === 'U') {
            modifiers.unique = true;
          } else {
            // Parse U{...}
            const content = unique.slice(2, -1);
            // Content might be list of numbers
            const nums = content.split(',').map(s => parseInt(s.trim(), 10));
            modifiers.unique = { notUnique: nums };
          }
        } else if (complex) {
          const type = complex[0]; // R, C, V
          const content = complex.slice(2, -1);
          
          if (type === 'R') {
             modifiers.reroll = parseComplexContent(content, modifiers.reroll || {}) as any;
          } else if (type === 'C') {
             modifiers.cap = parseComplexContent(content, modifiers.cap || {}) as any;
          } else if (type === 'V') {
             // Replace: V{1=2, >3=6}
             // content: "1=2, >3=6"
             modifiers.replace = parseReplaceContent(content);
          }
        } else if (arithmetic) {
           const val = parseInt(arithmetic.replace(/\s/g, ''), 10);
           if (val > 0) {
             modifiers.plus = (modifiers.plus || 0) + val;
           } else {
             modifiers.minus = (modifiers.minus || 0) + Math.abs(val);
           }
        }
      }
    }

    if (hasModifiers) {
      currentOption.modifiers = modifiers;
    }

    options.push(currentOption);
    const normalized = `${match[1] || ''}${match[2]}d${match[3]}${match[4]}`;
    normalizedNotations.push(normalized.trim()); 
    descriptions.push(generateDescription(currentOption));
  }

  return {
    valid: true,
    options,
    notation: normalizedNotations,
    description: descriptions
  };
};

// Helper to parse {>3, 1, <5} style content for Reroll/Cap
function parseComplexContent(content: string, existing: any): any {
  const parts = content.split(',');
  const result = { ...existing };
  
  parts.forEach(part => {
    part = part.trim();
    if (part.startsWith('>')) {
      result.greaterThan = parseInt(part.slice(1), 10);
    } else if (part.startsWith('<')) {
      result.lessThan = parseInt(part.slice(1), 10);
    } else {
       const val = parseInt(part, 10);
       result.exact = [...(result.exact || []), val];
    }
  });
  return result;
}

function parseReplaceContent(content: string): any {
  // 1=2, >3=6
  const parts = content.split(',');
  const replaces = [];
  
  parts.forEach(part => {
    const [fromStr, toStr] = part.split('=');
    if (!fromStr || !toStr) return;
    
    let fromVal: any;
    const f = fromStr.trim();
    if (f.startsWith('>')) {
      fromVal = { greaterThan: parseInt(f.slice(1), 10) };
    } else if (f.startsWith('<')) {
      fromVal = { lessThan: parseInt(f.slice(1), 10) };
    } else {
      fromVal = parseInt(f, 10);
    }
    
    const toVal = parseInt(toStr.trim(), 10);
    replaces.push({ from: fromVal, to: toVal });
  });
  
  if (replaces.length === 1) return replaces[0];
  return replaces;
}

function generateDescription(option: RollOption): string {
  const parts = [`Roll ${option.quantity} ${option.sides}-sided ${option.quantity === 1 ? 'die' : 'dice'}`];
  if (option.arithmetic === 'subtract') {
    parts.push('and Subtract the result');
  }
  
  const m = option.modifiers;
  if (m) {
    if (m.drop) {
      if (m.drop.lowest) parts.push(`Drop lowest${m.drop.lowest > 1 ? ` ${m.drop.lowest}` : ''}`);
      if (m.drop.highest) parts.push(`Drop highest${m.drop.highest > 1 ? ` ${m.drop.highest}` : ''}`);
    }
    if (m.explode) parts.push('Exploding Dice');
    if (m.reroll) {
      const r = m.reroll;
      if (r.exact) parts.push(`Reroll [${r.exact.join(', ')}]`);
      if (r.greaterThan) parts.push(`Reroll > ${r.greaterThan}`);
      if (r.lessThan) parts.push(`Reroll < ${r.lessThan}`);
    }
    if (m.plus) parts.push(`Add ${m.plus}`);
    if (m.minus) parts.push(`Subtract ${m.minus}`);
    if (m.unique) parts.push('No Duplicate Rolls');
  }
  
  return parts.join(', ');
}

