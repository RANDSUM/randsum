import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import type { RollerState } from '../../roller-state'
import { rollSteps } from './roll-steps'

const EMPTY_COPY = {
  empty: ['Your roll lands here', 'Every step is shown: what was rolled, dropped and added.'],
  valid: ['Ready to roll', 'Press Roll or Enter.'],
  invalid: ['Can’t roll that yet', 'Fix the notation and Roll comes back.']
} as const

/** The total and its steps, or what to do before there is one. */
export function readout(
  roller: RollerState,
  actions: TemplateResult | typeof nothing = nothing
): TemplateResult {
  const { result, check, notation } = roller
  if (result === null) {
    const [title, hint] = EMPTY_COPY[check.kind]
    return html`<section class="rsui-readout" data-empty="" aria-label="Result">
      <p class="rsui-readout-title">${title}</p>
      <p class="rsui-readout-hint">${hint}</p>
    </section>`
  }
  return html`<section
    class="rsui-readout"
    data-stale=${ifDefined(result.notation === notation ? undefined : '')}
    aria-label="Result"
  >
    <div class="rsui-result-head">
      <output class="rsui-total" aria-live="polite" aria-label=${`Total ${result.total}`}
        >${result.total}</output
      >
      <span class="rsui-result-meta">
        <code class="rsui-result-notation">${result.notation}</code>
        <span class="rsui-result-desc">${result.description}</span>
      </span>
      ${actions}
    </div>
    ${rollSteps(result.records)}
  </section>`
}
