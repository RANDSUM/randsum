// <randsum-scope>: one roller state for the parts inside it, so a page can
// build its own layout from the part elements with no script:
//
//   <randsum-scope notation="2d6+1">
//     <randsum-notation-field></randsum-notation-field>
//     <randsum-roll-button></randsum-roll-button>
//     <randsum-readout></randsum-readout>
//   </randsum-scope>
//
// It renders nothing itself (no shadow root), and fires randsum-change and
// randsum-roll for everything inside it.
import { ReactiveElement } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { announce, define } from './internal/element'
import { RollerState } from './roller-state'

export type { RandsumChangeEvent, RandsumRollEvent } from './internal/element'
export type { RollerState } from './roller-state'

export class RandsumScope extends ReactiveElement {
  static override properties: PropertyDeclarations = { notation: { noAccessor: true } }

  /** The state every part inside renders from. */
  readonly state: RollerState = new RollerState()

  constructor() {
    super()
    this.state.subscribe(event => {
      announce(this, event)
    })
  }

  /**
   * The notation. Setting it replaces what the user typed, at once, so a
   * roll() straight after rolls the new value.
   */
  get notation(): string {
    return this.state.notation
  }

  set notation(value: string | null | undefined) {
    const old = this.state.notation
    this.state.set(value ?? '')
    this.requestUpdate('notation', old)
  }

  /** Rolls the current notation, if it is valid. */
  roll(): void {
    this.state.roll()
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

define('randsum-scope', RandsumScope)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-scope': RandsumScope
  }
}
