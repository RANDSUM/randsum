// Types for roller.generated.js: the slice of @randsum/roller's `roll` the
// /roll mod reads. Written by hand; scripts/build-plugin-roller.ts writes only
// the .js. Widen it here if register.ts starts reading more of a result.

export interface RollConfig {
  readonly randomFn?: () => number
}

export interface RollRecord {
  readonly notation: string
  readonly description: readonly string[]
  readonly initialRolls: readonly number[]
  readonly rolls: readonly number[]
  readonly total: number
  readonly label?: string
}

export interface RollResult {
  readonly rolls: readonly RollRecord[]
  readonly values: readonly (number | string)[]
  readonly total: number
}

export declare function roll(...args: readonly (string | number | RollConfig)[]): RollResult
