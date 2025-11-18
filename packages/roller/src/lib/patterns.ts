// Core dice notation pattern: NdS where N is quantity and S is sides
export const coreNotationPattern = /(\d+)d(\d+)/i

// Complete roll pattern that matches a full dice notation with modifiers
// This pattern matches: NdS followed by optional modifiers
export const completeRollPattern = /(\d+)d(\d+)([LH](\d+)?|!|R\{[^}]+\}(\d+)?|C\{[^}]+\}|D\{[^}]+\}|V\{[^}]+\}|U(\{[^}]+\})?|[\+\-]\d+)*/gi

