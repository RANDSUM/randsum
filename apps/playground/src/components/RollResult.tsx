import type { RollRecord, RollerRollResult } from '@randsum/roller'
import { computeSteps, formatAsMath } from '@randsum/display-utils'
import type { TooltipStep } from '@randsum/display-utils'
import './RollResult.css'

export function DieBadge({
  value,
  variant
}: {
  readonly value: number
  readonly variant: 'unchanged' | 'removed' | 'added'
}): React.JSX.Element {
  const classNames = [
    'pg-die-badge',
    variant === 'removed' ? 'pg-die-badge--removed' : '',
    variant === 'added' ? 'pg-die-badge--added' : ''
  ]
    .filter(Boolean)
    .join(' ')

  const style: React.CSSProperties = variant === 'removed' ? { textDecoration: 'line-through' } : {}

  return (
    <span className={classNames} style={style}>
      {value}
    </span>
  )
}

export function StepRow({ step }: { readonly step: TooltipStep }): React.JSX.Element {
  if (step.kind === 'divider') {
    return <hr className="pg-step-divider" />
  }

  if (step.kind === 'arithmetic') {
    return (
      <div className="pg-step-row">
        <span className="pg-step-label">{step.label}</span>
        <span className="pg-step-arithmetic">{step.display}</span>
      </div>
    )
  }

  if (step.kind === 'rolls') {
    return (
      <div className="pg-step-row">
        <span className="pg-step-label">{step.label}</span>
        <span className="pg-die-badges">
          {step.removed.map((v, i) => (
            <DieBadge key={`r-${i}`} value={v} variant="removed" />
          ))}
          {step.added.map((v, i) => (
            <DieBadge key={`a-${i}`} value={v} variant="added" />
          ))}
          {step.unchanged.map((v, i) => (
            <DieBadge key={`u-${i}`} value={v} variant="unchanged" />
          ))}
        </span>
      </div>
    )
  }

  // finalRolls
  return (
    <div className="pg-step-row pg-step-row--final">
      <span className="pg-step-label">Final</span>
      <span className="pg-step-final-math">{formatAsMath(step.rolls, step.arithmeticDelta)}</span>
    </div>
  )
}

export function PoolSection({
  record,
  showHeading = false
}: {
  readonly record: RollRecord
  readonly showHeading?: boolean
}): React.JSX.Element {
  const steps = computeSteps(record)

  return (
    <div className="pg-pool-section">
      {showHeading && <h3 className="pg-pool-heading">{record.notation}</h3>}
      {steps.map((step, i) => (
        <StepRow key={i} step={step} />
      ))}
    </div>
  )
}

export function RollResult({ result }: { readonly result: RollerRollResult }): React.JSX.Element {
  const multiPool = result.rolls.length > 1

  return (
    <div className="pg-roll-result">
      <div className="pg-grand-total">{result.total}</div>
      <div className="pg-steps-container">
        {result.rolls.map((record, i) => (
          <PoolSection key={i} record={record} showHeading={multiPool} />
        ))}
      </div>
    </div>
  )
}
