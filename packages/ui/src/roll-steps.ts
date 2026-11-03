// <randsum-roll-steps>: just the steps of a roll. Give it `records`, or let it
// show the last result of the roller it belongs to.
import type { RollRecord } from '@randsum/roller'
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { rollSteps } from './internal/parts/roll-steps'
import type { StepsLayout } from './internal/parts/roll-steps'

export type { RollerState } from './roller-state'
export type { StepsLayout }

export class RandsumRollSteps extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    records: { attribute: false },
    layout: { reflect: true }
  }

  /** The roll's records. Defaults to the roller's last result. */
  declare records: readonly RollRecord[] | undefined

  /** `lanes` (the default) gives each die a column down the steps; `stacks` keeps one row of dice. */
  declare layout: StepsLayout | undefined

  protected override render(): unknown {
    const records = this.records ?? this.state?.result?.records
    if (records === undefined) return nothing
    return html`<div class="rsui rsui-part">${rollSteps(records, this.layout ?? 'lanes')}</div>`
  }
}

define('randsum-roll-steps', RandsumRollSteps)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-roll-steps': RandsumRollSteps
  }
}
