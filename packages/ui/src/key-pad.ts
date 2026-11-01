// <randsum-key-pad>: dice and modifier keys.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import { DEFAULT_KEYS } from './keys'
import type { Key } from './keys'
import { keyPad } from './internal/parts/key-pad'

export type { RollerState } from './roller-state'

export class RandsumKeyPad extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    keys: { type: Array },
    label: {}
  }

  /** The keys to show. Defaults to DEFAULT_KEYS from `@randsum/ui/keys`. */
  declare keys: readonly Key[]
  /** The group's accessible name. Defaults to "Dice keys". */
  declare label: string

  constructor() {
    super()
    this.keys = DEFAULT_KEYS
    this.label = 'Dice keys'
  }

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${keyPad(state, this.keys, this.label)}</div>`
  }
}

define('randsum-key-pad', RandsumKeyPad)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-key-pad': RandsumKeyPad
  }
}
