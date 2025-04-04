/**
 * Blades in the Dark game system implementation
 * 
 * This file implements the GameSystem interface for the Blades in the Dark system.
 */

import type {
  GameSystem,
  GameSystemRollOptions,
  GameSystemRollResult
} from '@randsum/core'
import { type NumericRollResult } from '@randsum/dice'
import { rollBlades } from './rollBlades'
import type { BladesResult } from './types'

/**
 * Blades in the Dark roll result
 */
export interface BladesRollResult extends GameSystemRollResult {
  /**
   * The outcome of the roll (critical, success, partial, failure)
   */
  outcome: BladesResult
  
  /**
   * The number of dice rolled
   */
  diceCount: number
}

/**
 * Blades in the Dark roll options
 */
export interface BladesRollOptions extends GameSystemRollOptions {
  /**
   * The number of dice to roll (dice pool)
   */
  diceCount: number
}

/**
 * Blades in the Dark game system implementation
 */
export const BladesSystem: GameSystem<BladesRollResult, BladesRollOptions> = {
  name: 'Blades in the Dark',
  
  roll: (options = { diceCount: 1 }) => {
    const { diceCount } = options
    
    // Roll the dice
    const [outcome, rollResult] = rollBlades(diceCount)
    
    return {
      rollResult,
      total: rollResult.total,
      rolls: rollResult.result.flat(),
      outcome,
      diceCount
    }
  },
  
  isSuccess: (result) => {
    // In Blades, both 'critical' and 'success' are considered successes
    return result.outcome === 'critical' || result.outcome === 'success'
  },
  
  getResultDescription: (result) => {
    switch (result.outcome) {
      case 'critical':
        return 'Critical Success! You do it with exceptional results.'
      case 'success':
        return 'Success! You do it without complications.'
      case 'partial':
        return 'Partial Success. You do it, but there's a consequence.'
      case 'failure':
        return 'Failure. Things go badly.'
      default:
        return `Unknown result: ${result.outcome}`
    }
  }
}
