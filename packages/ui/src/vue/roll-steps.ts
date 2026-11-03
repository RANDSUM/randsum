// <RollSteps>: <randsum-roll-steps> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'
import type { RollRecord } from '@randsum/roller'
import type { StepsLayout } from '../roll-steps'
import '../roll-steps'

export type { RollerState } from '../roller-state'

export interface RollStepsProps {
  readonly roller?: RollerState
  readonly records?: readonly RollRecord[]
  /** `lanes` (the default) gives each die a column down the steps; `stacks` keeps one row of dice. */
  readonly layout?: StepsLayout
}

export const RollSteps: DefineSetupFnComponent<RollStepsProps> = defineComponent(
  (props: RollStepsProps) => () => renderElement('randsum-roll-steps', { ...props }),
  { name: 'RandsumRollSteps', props: ['roller', 'records', 'layout'] }
)
