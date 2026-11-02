// The steps of a roll worth showing, shared by the elements and the native
// components. Not a public entry.
import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'

export type ShownStep = Exclude<RollTraceStep, { readonly kind: 'divider' | 'finalRolls' }>

function shown(step: RollTraceStep): step is ShownStep {
  return step.kind !== 'divider' && step.kind !== 'finalRolls'
}

/** What was rolled, what changed and what was added; no dividers or final rolls. */
export function visibleSteps(record: RollRecord): readonly ShownStep[] {
  return traceRoll(record).filter(shown)
}
