// <StatusLine>: <randsum-status-line> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'

import '../status-line'

export type { RollerState } from '../roller-state'

export interface StatusLineProps {
  readonly roller?: RollerState
  /** What the line says while the notation is empty. */
  readonly hint?: string
  /** Says the roll in English once the notation is valid. Defaults to true. */
  readonly showValid?: boolean
  readonly className?: string
}

export function StatusLine({ className, ...properties }: StatusLineProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-status-line', ref, className)
}
