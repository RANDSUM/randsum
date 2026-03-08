/**
 * Maximum attempts for reroll and unique modifiers before giving up.
 * Prevents infinite loops when conditions cannot be satisfied.
 */
export const MAX_REROLL_ATTEMPTS = 99

/**
 * Default depth limit for explosive modifiers (compound, penetrate).
 * Used when "unlimited" depth is requested (options === 0).
 *
 * Convention: passing `0` as explosion depth means "unlimited" in RANDSUM notation
 * (e.g., `2d6!!0`). Since true infinite recursion is impossible, we use this ceiling.
 */
export const DEFAULT_EXPLOSION_DEPTH = 1000

/**
 * Default depth for explode modifier when no depth specified.
 * Unlike compound/penetrate, basic explode only triggers once by default.
 */
export const DEFAULT_EXPLODE_DEPTH = 1
