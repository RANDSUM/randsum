/**
 * Generic type for game-specific roll results.
 * When TDetails is undefined, `details` is omitted from the type.
 * When TDetails is a concrete type, `details` is required.
 *
 * @template TResult - The type of the game-specific result (e.g., 'hit', 'miss', 'critical')
 * @template TDetails - Additional details about the roll, or undefined if none
 * @template TRollRecord - The type of roll record (typically RollRecord from @randsum/roller)
 */
export type GameRollResult<
  TResult,
  TDetails = undefined,
  TRollRecord = never
> = TDetails extends undefined
  ? { readonly rolls: readonly TRollRecord[]; readonly total: number; readonly result: TResult }
  : {
      readonly rolls: readonly TRollRecord[]
      readonly total: number
      readonly result: TResult
      readonly details: TDetails
    }
