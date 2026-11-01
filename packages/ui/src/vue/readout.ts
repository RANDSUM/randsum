// <Readout>: <randsum-readout> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'

import '../readout'

export type { RollerState } from '../roller-state'

export interface ReadoutProps {
  readonly roller?: RollerState
}

export const Readout: DefineSetupFnComponent<ReadoutProps> = defineComponent(
  (props: ReadoutProps) => () => renderElement('randsum-readout', { ...props }),
  { name: 'RandsumReadout', props: ['roller'] }
)
