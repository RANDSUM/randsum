// What the parts say, shared by the elements and the native components so
// both read the same. Not a public entry.
import type { NotationCheck } from '../check'

export const DEFAULT_HINT = 'Type notation, or tap a key.'

/** The readout's title and hint before there is a result. */
export const EMPTY_COPY: Readonly<Record<NotationCheck['kind'], readonly [string, string]>> = {
  empty: ['Your roll lands here', 'Every step is shown: what was rolled, dropped and added.'],
  valid: ['Ready to roll', 'Press Roll or Enter.'],
  invalid: ['Can’t roll that yet', 'Fix the notation and Roll comes back.']
}

export const EMPTY_HISTORY = 'Your rolls land here. Tap one to roll it again.'

/** The status line: the hint, the error, or the roll in English. */
export function statusText(check: NotationCheck, hint: string, showValid: boolean): string {
  if (check.kind === 'empty') return hint
  if (check.kind === 'invalid') return check.message
  return showValid ? check.description : ''
}
