import type React from 'react'
import type { RollResult } from './check'
import { RollSteps } from './roll-steps'
import type { Roller } from './use-roller'

export type { RollResult } from './check'
export type { Roller } from './use-roller'

const EMPTY_COPY = {
  empty: ['Your roll lands here', 'Every step is shown: what was rolled, dropped and added.'],
  valid: ['Ready to roll', 'Press Roll or Enter.'],
  invalid: ['Can’t roll that yet', 'Fix the notation and Roll comes back.']
} as const

/** The total and its steps, or what to do before there is one. */
export function Readout({
  roller,
  actions
}: {
  readonly roller: Roller
  readonly actions?: React.ReactNode
}): React.JSX.Element {
  const { result, check, notation } = roller
  if (result === null) {
    const [title, hint] = EMPTY_COPY[check.kind]
    return (
      <section className="rsui-readout" data-empty="" aria-label="Result">
        <p className="rsui-readout-title">{title}</p>
        <p className="rsui-readout-hint">{hint}</p>
      </section>
    )
  }
  return (
    <section
      className="rsui-readout"
      data-stale={result.notation === notation ? undefined : ''}
      aria-label="Result"
    >
      <ResultHead result={result} actions={actions} />
      <RollSteps records={result.records} />
    </section>
  )
}

function ResultHead({
  result,
  actions
}: {
  readonly result: RollResult
  readonly actions?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="rsui-result-head">
      <output className="rsui-total" aria-live="polite" aria-label={`Total ${result.total}`}>
        {result.total}
      </output>
      <span className="rsui-result-meta">
        <code className="rsui-result-notation">{result.notation}</code>
        <span className="rsui-result-desc">{result.description}</span>
      </span>
      {actions}
    </div>
  )
}
