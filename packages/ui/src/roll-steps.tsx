import type React from 'react'
import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'
import { withIds } from './internal/cx'

type DieVariant = 'kept' | 'removed' | 'added'

function dice(values: readonly number[], variant: DieVariant): React.JSX.Element[] {
  return withIds(values, variant).map(({ id, item }) => (
    <span key={id} className="rsui-die" data-variant={variant}>
      {item}
    </span>
  ))
}

function Step({
  step,
  label
}: {
  readonly step: RollTraceStep
  readonly label?: string
}): React.JSX.Element | null {
  if (step.kind === 'divider' || step.kind === 'finalRolls') return null
  if (step.kind === 'arithmetic') {
    return (
      <li className="rsui-step">
        <span className="rsui-step-label">{step.label}</span>
        <span className="rsui-step-math">{step.display}</span>
      </li>
    )
  }
  const replacements = step.replacements ?? []
  return (
    <li className="rsui-step">
      {label === undefined ? (
        <span className="rsui-step-label">{step.label}</span>
      ) : (
        <code className="rsui-step-label">{label}</code>
      )}
      <span className="rsui-dice">
        {withIds(replacements, 'r').map(({ id, item: r }) => (
          <span key={id} className="rsui-swap">
            <span className="rsui-die" data-variant="removed">
              {r.from}
            </span>
            <span aria-label="became">→</span>
            <span className="rsui-die" data-variant="added">
              {r.to}
            </span>
          </span>
        ))}
        {replacements.length === 0 && dice(step.removed, 'removed')}
        {replacements.length === 0 && dice(step.added, 'added')}
        {dice(step.unchanged, 'kept')}
      </span>
    </li>
  )
}

function visibleSteps(record: RollRecord): readonly RollTraceStep[] {
  return traceRoll(record).filter(step => step.kind !== 'divider' && step.kind !== 'finalRolls')
}

/** Every step of a roll: what was rolled, what changed, what was added. */
export function RollSteps({
  records
}: {
  readonly records: readonly RollRecord[]
}): React.JSX.Element {
  const multiPool = records.length > 1
  return (
    <div className="rsui-steps">
      {withIds(records, 'pool').map(({ id, item: record }) => {
        const steps = visibleSteps(record)
        const [only] = steps
        // A plain pool in a multi-pool roll is one row: its notation and its dice
        if (multiPool && steps.length === 1 && only !== undefined) {
          return (
            <ol key={id} className="rsui-pool">
              <Step step={only} label={record.notation} />
            </ol>
          )
        }
        return (
          <section key={id} className="rsui-pool-group" aria-label={record.notation}>
            {multiPool && (
              <h3 className="rsui-pool-heading">
                <code>{record.notation}</code>
                <span>{record.total}</span>
              </h3>
            )}
            <ol className="rsui-pool">
              {withIds(steps, 'step').map(step => (
                <Step key={step.id} step={step.item} />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
