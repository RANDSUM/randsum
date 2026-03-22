import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import { StepRow } from './RollSteps'
import './NotationRoller.css'

export interface RollResultPanelProps {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
  readonly onClose?: () => void
  readonly className?: string
}

export function RollResultPanel({
  total,
  records,
  notation,
  onClose,
  className
}: RollResultPanelProps): React.JSX.Element {
  return (
    <div className={['du-nr-tooltip-flow', className].filter(Boolean).join(' ')}>
      {onClose !== undefined && (
        <button className="du-nr-tooltip-close" onClick={onClose} aria-label="Close result">
          &times;
        </button>
      )}
      <div className="du-nr-tooltip-total-pane">
        <div className="du-nr-tooltip-total-value">{total}</div>
      </div>
      <RollResultDisplay records={records} total={total} notation={notation} />
    </div>
  )
}

export function RollResultDisplay({
  records,
  total,
  notation
}: {
  readonly records: readonly RollRecord[]
  readonly total?: number
  readonly notation?: string
}): React.JSX.Element {
  const multiPool = records.length > 1
  const steps = records.flatMap((record, i) => {
    const rows: React.JSX.Element[] = []
    if (multiPool) {
      rows.push(
        <div key={`heading-${i}`} className="du-nr-tooltip-row du-nr-pool-heading">
          {record.notation}
        </div>
      )
    }
    const traced = traceRoll(record)
    traced.forEach((step, j) => {
      rows.push(<StepRow key={`step-${i}-${j}`} step={step} />)
    })
    return rows
  })

  return (
    <div className="du-nr-tooltip-rows">
      {notation !== undefined && (
        <div className="du-nr-tooltip-row du-nr-tooltip-header-line">
          <span className="du-nr-tooltip-notation">{notation}</span>
          <span className="du-nr-tooltip-sep">|</span>
          <span className="du-nr-tooltip-desc">
            {records.map(r => r.description.join(', ')).join(' + ')}
          </span>
        </div>
      )}
      {steps}
      {total !== undefined && (
        <div className="du-nr-tooltip-row du-nr-tooltip-row--total">
          <span className="du-step-label du-nr-result-label--total">Total</span>
          <span className="du-step-final-math du-nr-result-dice--total">
            {records.length > 1
              ? records
                  .map((r, i) => {
                    const poolTotal =
                      r.rolls.length > 0 ? `[${r.rolls.join('+')}]` : `${r.appliedTotal}`
                    const prefix = i === 0 ? '' : r.appliedTotal < 0 ? ' - ' : ' + '
                    return `${prefix}${r.appliedTotal < 0 && i > 0 ? poolTotal.replace('-', '') : poolTotal}`
                  })
                  .join('') + ` = ${total}`
              : total}
          </span>
        </div>
      )}
    </div>
  )
}
