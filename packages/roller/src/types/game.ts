// ============================================================================
// Game Types - Types for game-specific roll functions
// ============================================================================

/**
 * Generic interface for game-specific roll results.
 * Game packages should implement this interface for their roll functions.
 *
 * @template TResult - The type of the game-specific result (e.g., 'hit', 'miss', 'critical')
 * @template TDetails - Optional additional details about the roll
 * @template TRollRecord - The type of roll record (typically RollRecord from @randsum/roller)
 */
export interface GameRollResult<TResult, TDetails = undefined, TRollRecord = never> {
  rolls: TRollRecord[]
  total: number
  result: TResult
  details?: TDetails
}
