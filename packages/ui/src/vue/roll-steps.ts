// <RollSteps>: <randsum-roll-steps> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'
import type { RollRecord } from '@randsum/roller'
import '../roll-steps'

export type { RollerState } from '../roller-state'

export interface RollStepsProps {
  readonly roller?: RollerState
  readonly records?: readonly RollRecord[]
}

export const RollSteps: DefineSetupFnComponent<RollStepsProps> = defineComponent(
  (props: RollStepsProps) => () => renderElement('randsum-roll-steps', { ...props }),
  { name: 'RandsumRollSteps', props: ['roller', 'records'] }
)
