/**
 * Input argument for a Powered by the Apocalypse roll.
 *
 * @example
 * ```ts
 * const result = rollPbtA({
 *   stat: 2,
 *   forward: 1,
 *   ongoing: 0
 * })
 * ```
 */
export interface PbtARollArgument {
  /** Stat modifier (typically -3 to +4) */
  stat: number
  /** One-time bonus (forward) */
  forward?: number
  /** Persistent bonus (ongoing) */
  ongoing?: number
  /** Roll with advantage (3d6, keep 2 highest) */
  advantage?: boolean
  /** Roll with disadvantage (3d6, keep 2 lowest) */
  disadvantage?: boolean
}

/**
 * Possible outcomes for a PbtA roll.
 *
 * - strong_hit: 10+ (complete success)
 * - weak_hit: 7-9 (partial success, success with cost)
 * - miss: 6- (failure)
 */
export type PbtAOutcome = 'strong_hit' | 'weak_hit' | 'miss'

/**
 * Additional details about a PbtA roll.
 */
export interface PbtARollDetails {
  /** Stat modifier used */
  stat: number
  /** Forward bonus applied */
  forward: number
  /** Ongoing bonus applied */
  ongoing: number
  /** Dice total before modifiers */
  diceTotal: number
}
