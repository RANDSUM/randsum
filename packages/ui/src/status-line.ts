// <randsum-status-line>: the hint, the error, or the roll in English.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { statusLine } from './internal/parts/status-line'

export type { RollerState } from './roller-state'

export class RandsumStatusLine extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    hint: {},
    showValid: { attribute: 'show-valid', converter: (value: string | null) => value !== 'false' }
  }

  /** What the line says while the notation is empty. */
  declare hint: string | undefined
  /** Says the roll in English once the notation is valid. Defaults to true. */
  declare showValid: boolean

  constructor() {
    super()
    this.showValid = true
  }

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${statusLine(state.check, { hint: this.hint, showValid: this.showValid })}</div>`
  }
}

define('randsum-status-line', RandsumStatusLine)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-status-line': RandsumStatusLine
  }
}
