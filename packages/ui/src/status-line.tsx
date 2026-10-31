import type React from 'react'
import type { NotationCheck } from './check'

export type { NotationCheck } from './check'

export function StatusLine({
  id,
  check,
  hint = 'Type notation, or tap a key.',
  showValid = true
}: {
  readonly id: string
  readonly check: NotationCheck
  readonly hint?: string
  readonly showValid?: boolean
}): React.JSX.Element {
  const text =
    check.kind === 'empty'
      ? hint
      : check.kind === 'invalid'
        ? check.message
        : showValid
          ? check.description
          : ''
  return (
    <p id={id} className="rsui-status" data-state={check.kind} aria-live="polite">
      {text}
    </p>
  )
}
