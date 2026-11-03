// <Readout>: <randsum-readout> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'

import type { StepsLayout } from '../readout'
import '../readout'

export type { RollerState } from '../roller-state'

export interface ReadoutProps {
  readonly roller?: RollerState
  /** `lanes` (the default) gives each die a column down the steps; `stacks` keeps one row of dice. */
  readonly layout?: StepsLayout
}

export const Readout: DefineSetupFnComponent<ReadoutProps> = defineComponent(
  (props: ReadoutProps) => () => renderElement('randsum-readout', { ...props }),
  { name: 'RandsumReadout', props: ['roller', 'layout'] }
)
