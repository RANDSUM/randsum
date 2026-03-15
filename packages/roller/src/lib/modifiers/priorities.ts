/**
 * Modifier execution priorities. Lower number = applied earlier.
 *
 * @example
 * ```ts
 * import { MODIFIER_PRIORITIES } from '@randsum/roller'
 * // Use to determine execution order when building custom game logic
 * ```
 */
export const MODIFIER_PRIORITIES: Record<string, number> & {
  readonly cap: 10
  readonly drop: 20
  readonly keep: 21
  readonly replace: 30
  readonly reroll: 40
  readonly explode: 50
  readonly compound: 51
  readonly penetrate: 52
  readonly explodeSequence: 53
  readonly wildDie: 55
  readonly unique: 60
  readonly multiply: 85
  readonly plus: 90
  readonly minus: 91
  readonly sort: 92
  readonly integerDivide: 93
  readonly modulo: 94
  readonly countSuccesses: 95
  readonly countFailures: 96
  readonly multiplyTotal: 100
} = {
  cap: 10,
  drop: 20,
  keep: 21,
  replace: 30,
  reroll: 40,
  explode: 50,
  compound: 51,
  penetrate: 52,
  explodeSequence: 53,
  wildDie: 55,
  unique: 60,
  multiply: 85,
  plus: 90,
  minus: 91,
  sort: 92,
  integerDivide: 93,
  modulo: 94,
  countSuccesses: 95,
  countFailures: 96,
  multiplyTotal: 100
} as const satisfies Record<string, number>

export type ModifierPriorityName = keyof typeof MODIFIER_PRIORITIES
