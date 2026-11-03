import type { RollRecord } from '@randsum/roller'
import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { diceLayout, poolName, visibleSteps } from '../steps'
import type { DiceLayout, PoolName, ShownStep } from '../steps'

type DieVariant = 'kept' | 'removed' | 'added'

function dice(values: readonly number[], variant: DieVariant): readonly TemplateResult[] {
  return values.map(value => die(value, variant))
}

function die(value: number, variant: DieVariant): TemplateResult {
  return html`<span class="rsui-die" data-variant=${variant}>${value}</span>`
}

/** The die that exploded, linked to each die its chain rolled. */
function chain(item: DiceLayout['chains'][number]): TemplateResult {
  return html`<span class="rsui-chain" role="group" aria-label=${`${item.from} exploded: ${item.rolls.join(', ')}`}
    >${die(item.from, 'kept')}${item.rolls.map(
      value => html`<span class="rsui-chain-link" aria-hidden="true">→</span>${die(value, 'kept')}`
    )}</span
  >`
}

/** A pool's name: notation in code, a label as plain words. */
function name(pool: PoolName): TemplateResult {
  return pool.notation ? html`<code>${pool.text}</code>` : html`<span>${pool.text}</span>`
}

/** One step; the initial roll (`initial`) stands out above the modifier steps. */
function step(item: ShownStep, initial: boolean, label?: PoolName): TemplateResult {
  if (item.kind === 'arithmetic') {
    return html`<li class="rsui-step">
      <span class="rsui-step-label">${item.label}</span>
      <span class="rsui-step-math">${item.display}</span>
    </li>`
  }
  const replacements = item.replacements ?? []
  const layout = diceLayout(item)
  return html`<li class="rsui-step" data-step=${initial ? 'initial' : 'modifier'}>
    ${
      label === undefined
        ? html`<span class="rsui-step-label">${item.label}</span>`
        : label.notation
          ? html`<code class="rsui-step-label">${label.text}</code>`
          : html`<span class="rsui-step-label">${label.text}</span>`
    }
    <span class="rsui-dice">
      ${layout.chains.map(chain)}
      ${replacements.map(
        r => html`<span class="rsui-swap"
          ><span class="rsui-die" data-variant="removed">${r.from}</span
          ><span aria-label="became">→</span
          ><span class="rsui-die" data-variant="added">${r.to}</span></span
        >`
      )}
      ${replacements.length === 0 ? dice(layout.removed, 'removed') : nothing}
      ${replacements.length === 0 ? dice(layout.added, 'added') : nothing}
      ${dice(layout.unchanged, 'kept')}
    </span>
  </li>`
}

/** Every step of a roll: what was rolled, what changed, what was added. */
export function rollSteps(records: readonly RollRecord[]): TemplateResult {
  const multiPool = records.length > 1
  return html`<div class="rsui-steps">
    ${records.map(record => {
      const pool = poolName(record)
      const steps = visibleSteps(record)
      const [only] = steps
      // A plain pool in a multi-pool roll is one row: its name and its dice
      if (multiPool && steps.length === 1 && only !== undefined) {
        return html`<ol class="rsui-pool">${step(only, true, pool)}</ol>`
      }
      return html`<section class="rsui-pool-group" aria-label=${pool.text}>
        ${
          multiPool
            ? html`<h3 class="rsui-pool-heading">
              ${name(pool)}<span>${record.total}</span>
            </h3>`
            : nothing
        }
        <ol class="rsui-pool">${steps.map((s, i) => step(s, i === 0))}</ol>
      </section>`
    })}
  </div>`
}
