// <NotationField>: <randsum-notation-field> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'

import '../notation-field'

export type { RollerState } from '../roller-state'

export interface NotationFieldProps {
  readonly roller?: RollerState
  readonly placeholder?: string
}

export const NotationField: DefineSetupFnComponent<NotationFieldProps> = defineComponent(
  (props: NotationFieldProps) => () => renderElement('randsum-notation-field', { ...props }),
  { name: 'RandsumNotationField', props: ['roller', 'placeholder'] }
)
