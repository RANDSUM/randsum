// The roller's state for Vue, for building your own layout from the part
// components: pass `roller` to each. `snapshot` is reactive, for your own markup.
import { onScopeDispose, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { NotationCheck, RollResult } from '../check'
import { RollerState } from '../roller-state'

export type { NotationCheck, RollResult } from '../check'
export type { RollerState } from '../roller-state'

export interface RollerSnapshot {
  readonly notation: string
  readonly check: NotationCheck
  readonly result: RollResult | null
}

const snap = (state: RollerState): RollerSnapshot => ({
  notation: state.notation,
  check: state.check,
  result: state.result
})

export function useRoller(defaultNotation = ''): {
  readonly roller: RollerState
  readonly snapshot: Readonly<ShallowRef<RollerSnapshot>>
} {
  const roller = new RollerState(defaultNotation)
  const snapshot = shallowRef(snap(roller))
  const off = roller.subscribe(() => {
    snapshot.value = snap(roller)
  })
  onScopeDispose(off)
  return { roller, snapshot }
}
