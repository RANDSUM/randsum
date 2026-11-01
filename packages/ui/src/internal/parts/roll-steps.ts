import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'
import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'

type DieVariant = 'kept' | 'removed' | 'added'

function dice(values: readonly number[], variant: DieVariant): readonly TemplateResult[] {
  return values.map(value => html`<span class="rsui-die" data-variant=${variant}>${value}</span>`)
}

function step(item: RollTraceStep, label?: string): TemplateResult | typeof nothing {
  if (item.kind === 'divider' || item.kind === 'finalRolls') return nothing
  if (item.kind === 'arithmetic') {
    return html`<li class="rsui-step">
      <span class="rsui-step-label">${item.label}</span>
      <span class="rsui-step-math">${item.display}</span>
    </li>`
  }
  const replacements = item.replacements ?? []
  return html`<li class="rsui-step">
    ${
      label === undefined
        ? html`<span class="rsui-step-label">${item.label}</span>`
        : html`<code class="rsui-step-label">${label}</code>`
    }
    <span class="rsui-dice">
      ${replacements.map(
        r => html`<span class="rsui-swap"
          ><span class="rsui-die" data-variant="removed">${r.from}</span
          ><span aria-label="became">→</span
          ><span class="rsui-die" data-variant="added">${r.to}</span></span
        >`
      )}
      ${replacements.length === 0 ? dice(item.removed, 'removed') : nothing}
      ${replacements.length === 0 ? dice(item.added, 'added') : nothing}
      ${dice(item.unchanged, 'kept')}
    </span>
  </li>`
}

function visibleSteps(record: RollRecord): readonly RollTraceStep[] {
  return traceRoll(record).filter(s => s.kind !== 'divider' && s.kind !== 'finalRolls')
}

/** Every step of a roll: what was rolled, what changed, what was added. */
export function rollSteps(records: readonly RollRecord[]): TemplateResult {
  const multiPool = records.length > 1
  return html`<div class="rsui-steps">
    ${records.map(record => {
      const steps = visibleSteps(record)
      const [only] = steps
      // A plain pool in a multi-pool roll is one row: its notation and its dice
      if (multiPool && steps.length === 1 && only !== undefined) {
        return html`<ol class="rsui-pool">${step(only, record.notation)}</ol>`
      }
      return html`<section class="rsui-pool-group" aria-label=${record.notation}>
        ${
          multiPool
            ? html`<h3 class="rsui-pool-heading">
              <code>${record.notation}</code><span>${record.total}</span>
            </h3>`
            : nothing
        }
        <ol class="rsui-pool">${steps.map(s => step(s))}</ol>
      </section>`
    })}
  </div>`
}
