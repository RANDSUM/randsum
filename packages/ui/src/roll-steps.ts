// <randsum-roll-steps>: just the steps of a roll. Give it `records`, or let it
// show the last result of the roller it belongs to.
import type { RollRecord } from '@randsum/roller'
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { rollSteps } from './internal/parts/roll-steps'

export type { RollerState } from './roller-state'

export class RandsumRollSteps extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    records: { attribute: false }
  }

  /** The roll's records. Defaults to the roller's last result. */
  declare records: readonly RollRecord[] | undefined

  protected override render(): unknown {
    const records = this.records ?? this.state?.result?.records
    if (records === undefined) return nothing
    return html`<div class="rsui rsui-part">${rollSteps(records)}</div>`
  }
}

define('randsum-roll-steps', RandsumRollSteps)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-roll-steps': RandsumRollSteps
  }
}
