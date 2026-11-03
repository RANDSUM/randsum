// <randsum-readout>: the total and every step, or what to do before a roll.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { readout } from './internal/parts/readout'
import type { StepsLayout } from './internal/parts/roll-steps'

export type { RollerState } from './roller-state'
export type { StepsLayout }

export class RandsumReadout extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    layout: { reflect: true }
  }

  /** `lanes` (the default) gives each die a column down the steps; `stacks` keeps one row of dice. */
  declare layout: StepsLayout | undefined

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${readout(state, nothing, this.layout ?? 'lanes')}</div>`
  }
}

define('randsum-readout', RandsumReadout)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-readout': RandsumReadout
  }
}
