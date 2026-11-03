// The steps of a roll worth showing, shared by the elements and the native
// components. Not a public entry.
import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'

export type ShownStep = Exclude<RollTraceStep, { readonly kind: 'divider' | 'finalRolls' }>

function shown(step: RollTraceStep): step is ShownStep {
  return step.kind !== 'divider' && step.kind !== 'finalRolls'
}

/** The heading of a pool's first step, the dice as they were first rolled. */
const INITIAL_ROLLS_LABEL = 'Initial Rolls'

/** What was rolled, what changed and what was added; no dividers or final rolls. */
export function visibleSteps(record: RollRecord): readonly ShownStep[] {
  return traceRoll(record)
    .filter(shown)
    .map((step, i) =>
      i === 0 && step.kind === 'rolls' ? { ...step, label: INITIAL_ROLLS_LABEL } : step
    )
}

/** A pool's name in a multi-pool roll. */
export interface PoolName {
  readonly text: string
  /** Whether `text` is notation (shown as code) rather than a label */
  readonly notation: boolean
}

/**
 * What a pool is called in a multi-pool roll: its label when it has one (a
 * game's "Hope" and "Fear" dice, or `[fire]` in notation), else its notation.
 */
export function poolName(record: RollRecord): PoolName {
  return record.label === undefined || record.label === ''
    ? { text: record.notation, notation: true }
    : { text: record.label, notation: false }
}

/** A dice step laid out for display: its explosion chains, then the other dice. */
export interface DiceLayout {
  /** Each chain: the die that triggered it, the dice it rolled, and what it became */
  readonly chains: readonly {
    readonly from: number
    readonly rolls: readonly number[]
    readonly to?: number
  }[]
  readonly removed: readonly number[]
  readonly added: readonly number[]
  readonly unchanged: readonly number[]
}

/** Takes one of `value` out of the first pool that has it. */
function take(value: number, ...pools: number[][]): void {
  for (const pool of pools) {
    const at = pool.indexOf(value)
    if (at !== -1) {
      pool.splice(at, 1)
      return
    }
  }
}

/**
 * Lays out a dice step so each die that exploded sits beside the dice it
 * rolled. The chain dice leave `added` (they show in the chain), the
 * triggering die leaves `unchanged` (or `removed`, when a compound folds it
 * into a new die), and what is left shows as before.
 */
export function diceLayout(step: ShownStep & { readonly kind: 'rolls' }): DiceLayout {
  const chains = step.explosions ?? []
  const removed = [...step.removed]
  const added = [...step.added]
  const unchanged = [...step.unchanged]
  for (const chain of chains) {
    if (chain.to === undefined) {
      for (const value of chain.rolls) take(value, added)
      take(chain.from, unchanged)
    } else {
      // A compounded die that came out unchanged (penetrate on a 1) is still in `unchanged`
      take(chain.from, removed, unchanged)
      take(chain.to, added, unchanged)
    }
  }
  return { chains, removed, added, unchanged }
}
