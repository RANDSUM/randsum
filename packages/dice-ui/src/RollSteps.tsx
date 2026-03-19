import type { RollRecord } from '@randsum/roller'
import type { RollTraceStep } from '@randsum/roller/trace'
import { formatAsMath, traceRoll } from '@randsum/roller/trace'
import './RollSteps.css'

export interface DieBadgeProps {
  readonly value: number
  readonly variant: 'unchanged' | 'removed' | 'added'
}

export interface StepRowProps {
  readonly step: RollTraceStep
}

export interface RollStepsProps {
  readonly record: RollRecord
  readonly showHeading?: boolean
}

export function DieBadge({ value, variant }: DieBadgeProps): React.JSX.Element {
  const classNames = [
    'du-die-badge',
    variant === 'removed' ? 'du-die-badge--removed' : '',
    variant === 'added' ? 'du-die-badge--added' : ''
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

export function StepRow({ step }: StepRowProps): React.JSX.Element {
  if (step.kind === 'divider') {
    return <hr className="du-step-divider" />
  }

  if (step.kind === 'arithmetic') {
    return (
      <div className="du-step-row">
        <span className="du-step-label">{step.label}</span>
        <span className="du-step-arithmetic">{step.display}</span>
      </div>
    )
  }

  if (step.kind === 'rolls') {
    return (
      <div className="du-step-row">
        <span className="du-step-label">{step.label}</span>
        <span className="du-die-badges">
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
    <div className="du-step-row du-step-row--final">
      <span className="du-step-label">Final</span>
      <span className="du-step-final-math">{formatAsMath(step.rolls, step.arithmeticDelta)}</span>
    </div>
  )
}

export function RollSteps({ record, showHeading = false }: RollStepsProps): React.JSX.Element {
  const steps = traceRoll(record)

  return (
    <div className="du-roll-steps">
      {showHeading && <h3 className="du-pool-heading">{record.notation}</h3>}
      {steps.map((step, i) => (
        <StepRow key={i} step={step} />
      ))}
    </div>
  )
}
