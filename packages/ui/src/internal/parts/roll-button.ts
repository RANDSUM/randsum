import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import type { RollerState } from '../../roller-state'

export interface RollButtonOptions {
  /** Shows the English description on hover and focus (Mini). */
  readonly tip?: boolean | undefined
  readonly tipId?: string | undefined
}

/** Roll, disabled until the notation is valid. */
export function rollButton(
  roller: RollerState,
  { tip = false, tipId = 'rsui-tip' }: RollButtonOptions = {}
): TemplateResult {
  const { check } = roller
  const description = check.kind === 'valid' ? check.description : undefined
  const showTip = tip && description !== undefined
  return html`<span class="rsui-roll-wrap">
    <button
      type="button"
      class="rsui-roll"
      ?disabled=${check.kind !== 'valid'}
      aria-describedby=${ifDefined(showTip ? tipId : undefined)}
      @click=${() => {
        roller.roll()
      }}
    >
      Roll
    </button>
    ${showTip ? html`<span id=${tipId} class="rsui-tip" role="tooltip">${description}</span>` : nothing}
  </span>`
}
