export const modifierToDescription = (modifier: string, options: any): string[] | undefined => {
  if (options === undefined) return undefined;
  
  switch (modifier) {
    case 'plus': return [`Add ${options}`];
    case 'minus': return [`Subtract ${options}`];
    case 'cap': {
      const parts = [];
      if (options.greaterThan !== undefined) parts.push(`No Rolls greater than [${options.greaterThan}]`);
      if (options.lessThan !== undefined) parts.push(`No Rolls less than [${options.lessThan}]`);
      return parts.length ? parts : undefined;
    }
    case 'drop': {
      const parts = [];
      if (options.lowest) parts.push(`Drop lowest${options.lowest > 1 ? ` ${options.lowest}` : ''}`);
      if (options.highest) parts.push(`Drop highest${options.highest > 1 ? ` ${options.highest}` : ''}`);
      // other drop types...
      return parts.length ? parts : undefined;
    }
    case 'reroll': {
      const parts = [];
      if (options.exact) parts.push(`Reroll [${options.exact.join('] and [')}]`);
      // others...
      return parts.length ? parts : undefined;
    }
    case 'explode': return ['Exploding Dice'];
    case 'unique': return ['No Duplicate Rolls'];
    case 'replace': return [`Replace [${options.from}] with [${options.to}]`];
  }
  return undefined;
};

export const modifierToNotation = (modifier: string, options: any): string | undefined => {
  if (options === undefined) return undefined;

  switch (modifier) {
    case 'plus': 
      return options < 0 ? `${options}` : `+${options}`;
    case 'minus': 
      return `-${options}`;
    case 'cap': {
      const parts = [];
      if (options.greaterThan !== undefined) parts.push(`>${options.greaterThan}`);
      if (options.lessThan !== undefined) parts.push(`<${options.lessThan}`);
      return `C{${parts.join(',')}}`;
    }
    case 'drop': {
      if (options.lowest) return options.lowest > 1 ? `L${options.lowest}` : 'L';
      if (options.highest) return options.highest > 1 ? `H${options.highest}` : 'H';
      // others...
      return '';
    }
    case 'reroll': {
      const parts = [];
      if (options.exact) parts.push(options.exact.join(','));
      if (options.greaterThan !== undefined) parts.push(`>${options.greaterThan}`);
      if (options.lessThan !== undefined) parts.push(`<${options.lessThan}`);
      return `R{${parts.join(',')}}`;
    }
    case 'explode': return '!';
    case 'unique': return 'U';
    case 'replace': 
      return `V{${options.from}=${options.to}}`;
  }
  return undefined;
};

export * from './applyModifiers';

