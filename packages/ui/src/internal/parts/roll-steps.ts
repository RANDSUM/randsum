import type { RollRecord } from '@randsum/roller'
import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { poolName, timeline, visibleSteps } from '../steps'
import type { Lane, LaneNode, PoolName, StepInk, Timeline, TimelineRow } from '../steps'

/**
 * How a roll's steps are drawn: `lanes` gives each die a column that runs
 * down through the steps (Max, the MCP card); `stacks` keeps one row of dice
 * with each changed die's history stacked above it (Compact, Mini).
 */
export type StepsLayout = 'lanes' | 'stacks'

type DieVariant = 'kept' | 'removed'

function die(value: number, variant: DieVariant, label?: string): TemplateResult {
  return html`<span class="rsui-die" data-variant=${variant} aria-label=${ifDefined(label)}
    >${value}</span
  >`
}

/** An arithmetic step as a cell: green when it adds, red when it subtracts. */
function mathCell(row: TimelineRow): TemplateResult {
  const term = (row.math ?? '').replace(/^-/, '−')
  return html`<span class="rsui-die rsui-math" data-ink=${row.ink} aria-label=${`${row.label} ${row.math}`}
    >${term}</span
  >`
}

/** A compounding explosion: the die that set it off, linked to each die it rolled. */
function chain(dice: readonly number[]): TemplateResult {
  const [from, ...rolls] = dice
  return html`<span class="rsui-chain" role="group" aria-label=${`${from} exploded: ${rolls.join(', ')}`}
    >${dice.map(
      (value, i) =>
        html`${i > 0 ? html`<span class="rsui-chain-link" aria-hidden="true">→</span>` : nothing}${die(value, 'kept')}`
    )}</span
  >`
}

/** A die where a step touched it. */
function node(n: LaneNode): TemplateResult {
  switch (n.kind) {
    case 'removed':
      return die(n.value, 'removed', `${n.value}, removed`)
    case 'trigger':
      return die(n.value, 'kept', `${n.value} exploded: ${(n.exploded ?? []).join(', ')}`)
    case 'changed':
      return n.chain === undefined
        ? die(n.value, 'kept', `${n.value}, was ${n.was}`)
        : chain(n.chain)
    default:
      return die(n.value, 'kept')
  }
}

/** The ink of the line that runs into the next node after `row` (or at it, with `at`). */
function lineInk(rows: readonly TimelineRow[], lane: Lane, row: number, at: boolean): string {
  const next = lane.nodes.find(n => (at ? n.row >= row : n.row > row))
  if (next === undefined) return 'plain'
  if (next.kind === 'removed') return 'removed'
  if (next.kind === 'changed') return rows[next.row]?.ink ?? 'plain'
  return 'plain'
}

function label(text: string, ink: StepInk, row: number, strong: boolean): TemplateResult {
  return html`<span
    class="rsui-step-label"
    data-ink=${ink}
    data-strong=${ifDefined(strong ? '' : undefined)}
    style=${`grid-area: ${row} / 1`}
    title=${text}
    ><span class="rsui-step-text">${text}</span></span
  >`
}

/** Each die in its own lane, carried down until a step touches it. */
function lanes(t: Timeline): TemplateResult {
  const resultRow = t.rows.length + 1
  const mathColumn = t.lanes.length + 2
  return html`<div class="rsui-lanes-scroll">
    <div
      class="rsui-lanes"
      data-lanes=${t.lanes.length > 12 ? 'many' : t.lanes.length}
      style=${`--lanes: ${Math.max(t.lanes.length, 1)}`}
    >
      <span class="rsui-lanes-frame" style="grid-area: 1 / 1 / 2 / -1"></span>
      ${t.rows.map((row, r) => label(row.label, row.ink, r + 1, r === 0))}
      ${t.rows.map((row, r) =>
        row.math === undefined
          ? nothing
          : html`<span class="rsui-lane" style=${`grid-area: ${r + 1} / ${mathColumn}`}
              >${mathCell(row)}</span
            >`
      )}
      ${
        t.changed
          ? html`<span class="rsui-lanes-rule" style=${`grid-area: ${resultRow} / 1 / ${resultRow + 1} / -1`}></span>
            ${label('Result', 'plain', resultRow, true)}`
          : nothing
      }
      ${t.lanes.map((lane, i) => {
        const first = lane.nodes[0]?.row ?? 0
        const last = lane.nodes[lane.nodes.length - 1]
        const end =
          last === undefined || last.kind === 'removed' || !t.changed
            ? (last?.row ?? 0)
            : t.rows.length
        return Array.from({ length: end - first + 1 }, (_, k) => {
          const r = first + k
          const n = lane.nodes.find(x => x.row === r)
          const inInk = r > first ? lineInk(t.rows, lane, r, true) : undefined
          const outInk = r < end ? lineInk(t.rows, lane, r, false) : undefined
          const content =
            n !== undefined
              ? node(n)
              : r === t.rows.length && lane.final !== undefined
                ? die(lane.final, 'kept')
                : nothing
          return html`<span
            class="rsui-lane"
            style=${`grid-area: ${r + 1} / ${i + 2}`}
            data-row=${ifDefined(r === 0 ? 'initial' : r === t.rows.length ? 'result' : undefined)}
            data-in=${ifDefined(inInk)}
            data-out=${ifDefined(outInk)}
            >${
              n?.kind === 'born' && lane.chained
                ? html`<span class="rsui-lane-arrow" aria-hidden="true">→</span>`
                : nothing
            }${content}</span
          >`
        })
      })}
    </div>
    ${legend(t.rows.slice(1), 'rsui-legend rsui-lanes-legend')}
  </div>`
}

/** The steps' names in their inks, for when the dice leave no room beside them. */
function legend(rows: readonly TimelineRow[], className: string): TemplateResult | typeof nothing {
  return rows.length === 0
    ? nothing
    : html`<ul class=${className}>
        ${rows.map(row => html`<li class="rsui-step-label" data-ink=${row.ink}>${row.label}</li>`)}
      </ul>`
}

/** One row of dice as they ended up, each changed die's history stacked above it. */
function stacks(t: Timeline): TemplateResult {
  return html`<div class="rsui-stacks">
    <div class="rsui-stack-row">
      ${t.lanes.map(lane => {
        const last = lane.nodes[lane.nodes.length - 1]
        const history = lane.nodes.filter(n => n.kind === 'changed')
        return html`${lane.chained ? html`<span class="rsui-stack-arrow" aria-hidden="true">→</span>` : nothing}<span
            class="rsui-stack"
            >${history.map(
              n => html`<span class="rsui-die" data-variant="was" aria-hidden="true">${n.was}</span
                ><span class="rsui-stack-link" data-ink=${t.rows[n.row]?.ink ?? 'plain'}></span>`
            )}${
              lane.final === undefined
                ? die(last?.value ?? 0, 'removed', `${last?.value}, removed`)
                : die(
                    lane.final,
                    'kept',
                    history.length > 0 ? `${lane.final}, was ${history[0]?.was}` : undefined
                  )
            }</span
          >`
      })}
      ${t.rows.map(row => (row.math === undefined ? nothing : mathCell(row)))}
    </div>
    ${legend(t.rows.slice(1), 'rsui-legend')}
  </div>`
}

/** A pool's name: notation in code, a label as plain words. */
function name(pool: PoolName): TemplateResult {
  return pool.notation ? html`<code>${pool.text}</code>` : html`<span>${pool.text}</span>`
}

/** A plain pool in a multi-pool roll: its name and its dice on one row. */
function plainPool(record: RollRecord, pool: PoolName): TemplateResult {
  return html`<div class="rsui-step" data-step="initial">
    ${
      pool.notation
        ? html`<code class="rsui-step-label">${pool.text}</code>`
        : html`<span class="rsui-step-label">${pool.text}</span>`
    }
    <span class="rsui-dice">${record.initialRolls.map(value => die(value, 'kept'))}</span>
  </div>`
}

/** Every step of a roll: what was rolled, what changed, what was added. */
export function rollSteps(
  records: readonly RollRecord[],
  layout: StepsLayout = 'lanes'
): TemplateResult {
  const multiPool = records.length > 1
  return html`<div class="rsui-steps" data-layout=${layout}>
    ${records.map(record => {
      const pool = poolName(record)
      if (multiPool && visibleSteps(record).length === 1) return plainPool(record, pool)
      const t = timeline(record)
      return html`<section class="rsui-pool-group" aria-label=${pool.text}>
        ${
          multiPool
            ? html`<h3 class="rsui-pool-heading">
              ${name(pool)}<span>${record.total}</span>
            </h3>`
            : nothing
        }
        ${layout === 'stacks' ? stacks(t) : lanes(t)}
      </section>`
    })}
  </div>`
}
