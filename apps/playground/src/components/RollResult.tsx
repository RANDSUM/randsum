import type { RollerRollResult } from '@randsum/roller'
import { RollSteps } from '@randsum/dice-ui'
import './RollResult.css'

export function RollResult({ result }: { readonly result: RollerRollResult }): React.JSX.Element {
  const multiPool = result.rolls.length > 1

  return (
    <div className="pg-roll-result">
      <div className="pg-grand-total">{result.total}</div>
      <div className="pg-steps-container">
        {result.rolls.map((record, i) => (
          <RollSteps key={i} record={record} showHeading={multiPool} />
        ))}
      </div>
    </div>
  )
}
