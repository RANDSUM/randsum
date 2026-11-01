// <randsum-readout>: the total and every step, or what to do before a roll.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { readout } from './internal/parts/readout'

export type { RollerState } from './roller-state'

export class RandsumReadout extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties
  }

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${readout(state)}</div>`
  }
}

define('randsum-readout', RandsumReadout)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-readout': RandsumReadout
  }
}
