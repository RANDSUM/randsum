// <NotationField>: <randsum-notation-field> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'

import '../notation-field'

export type { RollerState } from '../roller-state'

export interface NotationFieldProps {
  readonly roller?: RollerState
  /** Shown while the field is empty. Defaults to 4d6L. */
  readonly placeholder?: string
  readonly className?: string
}

export function NotationField({ className, ...properties }: NotationFieldProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-notation-field', ref, className)
}
