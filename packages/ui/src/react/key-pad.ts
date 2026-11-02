// <KeyPad>: <randsum-key-pad> for React. Give it the state from useRoller as `roller`.
import type React from 'react'
import { renderPart, useElement } from '../internal/react'
import type { RollerState } from '../roller-state'
import type { Key } from '../keys'
import '../key-pad'

export type { RollerState } from '../roller-state'

export interface KeyPadProps {
  readonly roller?: RollerState
  /** The keys to show. Defaults to DEFAULT_KEYS. */
  readonly keys?: readonly Key[]
  readonly label?: string
  readonly className?: string
}

export function KeyPad({ className, ...properties }: KeyPadProps): React.JSX.Element {
  const { ref } = useElement<HTMLElement>(properties)
  return renderPart('randsum-key-pad', ref, className)
}
