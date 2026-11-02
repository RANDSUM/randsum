// <randsum-roll-button>: Roll, disabled until the notation is valid.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { rollButton } from './internal/parts/roll-button'

export type { RollerState } from './roller-state'

export class RandsumRollButton extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    tip: { type: Boolean }
  }

  /** Shows the roll in English on hover and focus. */
  declare tip: boolean

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${rollButton(state, { tip: this.tip })}</div>`
  }
}

define('randsum-roll-button', RandsumRollButton)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-roll-button': RandsumRollButton
  }
}
