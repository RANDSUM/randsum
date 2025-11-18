import { RollOption } from '../types';
import { validateNotation } from '../validateNotation';

export const notationToOptions = (notation: string): RollOption[] => {
  const validation = validateNotation(notation);
  return validation.valid ? validation.options : [];
};

