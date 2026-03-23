/**
 * Modifier execution priorities. Lower number = applied earlier.
 *
 * @deprecated Use `RANDSUM_MODIFIERS` directly. Each entry in the array has a `priority` field
 * and `name` field. This constant is kept for backwards compatibility but may drift from the
 * source of truth in `RANDSUM_MODIFIERS`.
 *
 * @example
 * ```ts
 * import { RANDSUM_MODIFIERS } from '@randsum/roller'
 * // Use to determine execution order when building custom game logic
 * const capPriority = RANDSUM_MODIFIERS.find(m => m.name === 'cap')?.priority
 * ```
 */
export const MODIFIER_PRIORITIES: Record<string, number> & {
  readonly cap: 10
  readonly drop: 65
  readonly keep: 66
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
  readonly sort: 95
  readonly integerDivide: 93
  readonly modulo: 94
  readonly count: 80
  readonly multiplyTotal: 100
} = {
  cap: 10,
  drop: 65,
  keep: 66,
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
  sort: 95,
  integerDivide: 93,
  modulo: 94,
  count: 80,
  multiplyTotal: 100
} as const satisfies Record<string, number>
