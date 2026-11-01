// <randsum-notation-field>: the input, each notation token in its modifier's colour.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { notationField } from './internal/parts/notation-field'

export type { RollerState } from './roller-state'

export class RandsumNotationField extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    placeholder: {}
  }

  /** Shown while the field is empty. Defaults to 4d6L. */
  declare placeholder: string | undefined

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${notationField(state, { placeholder: this.placeholder })}</div>`
  }
}

define('randsum-notation-field', RandsumNotationField)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-notation-field': RandsumNotationField
  }
}
