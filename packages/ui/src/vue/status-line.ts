// <StatusLine>: <randsum-status-line> for Vue. Give it `roller` from useRoller.
import { defineComponent } from 'vue'
import type { DefineSetupFnComponent } from 'vue'
import { renderElement } from '../internal/vue'
import type { RollerState } from '../roller-state'

import '../status-line'

export type { RollerState } from '../roller-state'

export interface StatusLineProps {
  readonly roller?: RollerState
  readonly hint?: string
  readonly showValid?: boolean
}

export const StatusLine: DefineSetupFnComponent<StatusLineProps> = defineComponent(
  (props: StatusLineProps) => () => renderElement('randsum-status-line', { ...props }),
  { name: 'RandsumStatusLine', props: ['roller', 'hint', 'showValid'] }
)
