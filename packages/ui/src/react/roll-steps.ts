// <RollSteps>: <randsum-roll-steps> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'
import type { RollRecord } from '@randsum/roller'
import '../roll-steps'

export type { RollerState } from '../roller-state'

export interface RollStepsProps {
  readonly roller?: RollerState
  /** The roll's records. Defaults to the roller's last result. */
  readonly records?: readonly RollRecord[]
  readonly className?: string
}

export function RollSteps({ className, ...properties }: RollStepsProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-roll-steps', ref, className)
}
