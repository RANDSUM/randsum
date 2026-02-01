/**
 * Maximum attempts for reroll and unique modifiers before giving up.
 * Prevents infinite loops when conditions cannot be satisfied.
 */
export const MAX_REROLL_ATTEMPTS = 99

/**
 * Default depth limit for explosive modifiers (compound, penetrate).
 * Used when unlimited depth is requested (depth = 0 or true).
 * Set high enough to allow dramatic results but prevent true infinite loops.
 */
export const DEFAULT_EXPLOSION_DEPTH = 1000

/**
 * Default depth for explode modifier when no depth specified.
 * Unlike compound/penetrate, basic explode only triggers once by default.
 */
export const DEFAULT_EXPLODE_DEPTH = 1
