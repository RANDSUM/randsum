// <RollButton>: <randsum-roll-button> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'

import '../roll-button'

export type { RollerState } from '../roller-state'

export interface RollButtonProps {
  readonly roller?: RollerState
  readonly tip?: boolean
}

export const RollButton: DefineSetupFnComponent<RollButtonProps> = defineComponent(
  (props: RollButtonProps) => () => renderElement('randsum-roll-button', { ...props }),
  { name: 'RandsumRollButton', props: ['roller', 'tip'] }
)
