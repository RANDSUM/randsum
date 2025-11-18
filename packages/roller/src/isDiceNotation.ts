export const isDiceNotation = (argument: unknown): boolean => {
  if (typeof argument !== 'string') return false;
  if (argument.trim() === '') return false;

  // Pattern breakdown:
  // ^\s* - Start of string, optional whitespace
  // (
  //   [+-]?\s* - Optional sign and whitespace
  //   \d+ - Quantity (Required)
  //   [dD] - Separator
  //   \d+ - Sides (Required)
  //   (?:
  //     [LH] - Drop (Lowest/Highest)
  //     | ! - Explode
  //     | [RCUV]\{[^}]+\} - Reroll, Cap, Unique, Value (Replace) with arguments
  //     | [+-]\d+(?![dD]) - Arithmetic modifier, ensuring it's not the start of another dice term
  //   )*
  //   \s* - Optional whitespace
  // )+
  // $ - End of string

  // We also need to handle the case where sides is 0, or quantity is 0, or sides is 1.
  // The regex \d+ covers all digits.
  
  // Wait, the regex for modifiers need to be careful.
  // 4d6L is valid. 4d6L2 is valid. 
  // So [LH](\d+)?
  
  const pattern = /^\s*(?:[+-]?\s*\d+[dD]\d+(?:\s*(?:[LH](?:\d+)?|!|U(?:\{[^}]+\})?|[RCV]\{[^}]+\}|[+-]\s*\d+(?![dD])))*\s*)+$/;

  return pattern.test(argument);
};

