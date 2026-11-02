// <KeyPad>: <randsum-key-pad> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'
import type { Key } from '../keys'
import '../key-pad'

export type { RollerState } from '../roller-state'

export interface KeyPadProps {
  readonly roller?: RollerState
  readonly keys?: readonly Key[]
  readonly label?: string
}

export const KeyPad: DefineSetupFnComponent<KeyPadProps> = defineComponent(
  (props: KeyPadProps) => () => renderElement('randsum-key-pad', { ...props }),
  { name: 'RandsumKeyPad', props: ['roller', 'keys', 'label'] }
)
