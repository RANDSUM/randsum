export const ERROR_MESSAGES = {
  ROLL_ONE_REQUIRED: (modifier: string): string =>
    `rollOne function required for ${modifier} modifier`,
  ROLL_ONE_CONTEXT_REQUIRED: (modifier: string): string =>
    `rollOne and context required for ${modifier} modifier`,
  UNKNOWN_MODIFIER: (type: string): string => `Unknown modifier type: ${type}`
} as const

export const FORMAT_STRINGS = {
  GREATER_THAN: (value: number): string => `greater than [${value}]`,
  LESS_THAN: (value: number): string => `less than [${value}]`,
  ADD: (value: number): string => `Add ${value}`,
  SUBTRACT: (value: number): string => `Subtract ${value}`,
  NO_ROLLS: (condition: string): string => `No Rolls ${condition}`,
  REROLL: (condition: string, max?: number): string =>
    `Reroll ${condition}${max !== undefined ? ` (up to ${max} times)` : ''}`,
  REPLACE: (from: string, to: number): string => `Replace ${from} with [${to}]`,
  NO_DUPLICATES: 'No Duplicate Rolls',
  NO_DUPLICATES_EXCEPT: (values: string): string => `No Duplicates (except ${values})`,
  EXPLODING_DICE: 'Exploding Dice'
} as const

export const REGEX_PATTERNS: Record<string, RegExp | string> = {
  BRACED_CONTENT: '([^}]{1,50})',
  OPTIONAL_DIGITS: '(\\d+)?',
  BRACE_CLEANUP: /[{}]/g
} as const

export const MAGIC_NUMBERS = {
  DEFAULT_DROP_COUNT: 1,
  MAX_REROLL_ATTEMPTS: 99
} as const
