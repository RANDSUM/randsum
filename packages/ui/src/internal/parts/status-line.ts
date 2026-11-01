import { html } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import type { NotationCheck } from '../../check'
import { DEFAULT_HINT, statusText } from '../copy'

export interface StatusLineOptions {
  readonly id?: string | undefined
  readonly hint?: string | undefined
  readonly showValid?: boolean | undefined
}

/** The hint, the error, or the roll in English. */
export function statusLine(
  check: NotationCheck,
  { id, hint = DEFAULT_HINT, showValid = true }: StatusLineOptions = {}
): TemplateResult {
  const text = statusText(check, hint, showValid)
  return html`<p id=${ifDefined(id)} class="rsui-status" data-state=${check.kind} aria-live="polite">
    ${text}
  </p>`
}
