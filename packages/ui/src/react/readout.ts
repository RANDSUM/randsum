// <Readout>: <randsum-readout> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'

import '../readout'

export type { RollerState } from '../roller-state'

export interface ReadoutProps {
  readonly roller?: RollerState

  readonly className?: string
}

export function Readout({ className, ...properties }: ReadoutProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-readout', ref, className)
}
