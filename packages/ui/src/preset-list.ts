// <randsum-preset-list>: named rolls as chips or a list.
import { html, nothing } from 'lit'
import type { PropertyDeclarations } from 'lit'
import { define, PartElement } from './internal/element'
import type { Preset } from './presets'
import { presetList } from './internal/parts/preset-list'
import type { PresetsLayout } from './internal/parts/preset-list'

export type { PresetsLayout } from './internal/parts/preset-list'

export type { RollerState } from './roller-state'

export class RandsumPresetList extends PartElement {
  static override properties: PropertyDeclarations = {
    ...PartElement.properties,
    presets: { type: Array },
    label: {},
    layout: {}
  }

  /** The named rolls. */
  declare presets: readonly Preset[]
  /** The group's accessible name. Defaults to "Presets". */
  declare label: string
  /** 'chips' (the default) or 'list', which shows each description. */
  declare layout: PresetsLayout

  constructor() {
    super()
    this.presets = []
    this.label = 'Presets'
    this.layout = 'chips'
  }

  protected override render(): unknown {
    const state = this.state
    if (state === undefined) return nothing
    return html`<div class="rsui rsui-part">${presetList(state, this.presets, this.label, this.layout)}</div>`
  }
}

define('randsum-preset-list', RandsumPresetList)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-preset-list': RandsumPresetList
  }
}
