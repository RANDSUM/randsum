// <RollButton>: <randsum-roll-button> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'

import '../roll-button'

export type { RollerState } from '../roller-state'

export interface RollButtonProps {
  readonly roller?: RollerState
  /** Shows the roll in English on hover and focus. */
  readonly tip?: boolean
  readonly className?: string
}

export function RollButton({ className, ...properties }: RollButtonProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-roll-button', ref, className)
}
