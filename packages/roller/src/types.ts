export interface RollOption {
  sides: number | string[];
  quantity?: number;
  arithmetic?: 'add' | 'subtract';
  modifiers?: RollModifiers;
  description?: string[]; // Add this as tests use it in createRollParams
  notation?: string;      // Add this
}

// Alias for RollOption as used in tests?
// tests use `createRollParams` which likely matches RollOption.
export type RollParameters = RollOption;

export interface RollModifiers {
  plus?: number;
  minus?: number;
  drop?: DropModifier;
  explode?: boolean;
  reroll?: RerollModifier;
  cap?: CapModifier;
  unique?: boolean | UniqueModifier;
  replace?: ReplaceModifier | ReplaceModifier[];
}

export interface DropModifier {
  lowest?: number;
  highest?: number;
  greaterThan?: number;
  lessThan?: number;
  exact?: number[];
}

export interface RerollModifier {
  greaterThan?: number;
  lessThan?: number;
  exact?: number[];
  max?: number;
}

export interface CapModifier {
  greaterThan?: number;
  lessThan?: number;
}

export interface UniqueModifier {
  notUnique?: number[];
}

export interface ReplaceModifier {
  from: number | { greaterThan: number } | { lessThan: number };
  to: number;
}

export interface RollResult {
  total: number;
  rolls: IndividualRoll[];
  result: any[];
}

export interface IndividualRoll {
  total: number;
  rolls: number[];
  modifierFlags?: string[];
  parameters?: RollParameters;
  modifierHistory?: {
     initialRolls: number[];
     modifiedRolls: number[];
     total: number;
     logs: ModifierLog[];
  };
}

export type DiceNotation = string;
export type RollArgument = number | RollOption | DiceNotation;

export interface NumericRollBonus {
  rolls: number[];
  simpleMathModifier: number;
  logs: ModifierLog[];
}

export interface ModifierLog {
  modifier: string;
  options?: any;
  added?: number[];
  removed?: number[];
}
