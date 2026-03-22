import type { RollResult as RollResultData } from '@randsum/dice-ui'
import { RollSteps } from '@randsum/dice-ui'
import './RollResult.css'

export function RollResult({ result }: { readonly result: RollResultData }): React.JSX.Element {
  const multiPool = result.records.length > 1

  return (
    <div className="pg-roll-result">
      <div className="pg-grand-total">{result.total}</div>
      <div className="pg-steps-container">
        {result.records.map((record, i) => (
          <RollSteps key={i} record={record} showHeading={multiPool} />
        ))}
      </div>
    </div>
  )
}
