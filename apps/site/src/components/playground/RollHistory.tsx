import type { HistoryEntry } from './hooks/useRollHistory'

interface RollHistoryProps {
  readonly history: readonly HistoryEntry[]
  readonly onClear: () => void
}

export function RollHistory({ history, onClear }: RollHistoryProps): React.JSX.Element {
  if (history.length === 0) {
    return (
      <div className="playground-history playground-history-empty">
        <p>No rolls yet. Enter notation above or click a die button to start.</p>
      </div>
    )
  }

  return (
    <div className="playground-history">
      <div className="playground-history-header">
        <h3>Roll History</h3>
        <button onClick={onClear} className="playground-clear-btn" type="button">
          Clear
        </button>
      </div>
      <div className="playground-history-list">
        {history.map(entry => (
          <div key={entry.id} className="playground-history-entry">
            <div className="playground-history-notation">
              <code>{entry.notation}</code>
              <span className="playground-history-total">{entry.total}</span>
            </div>
            <div className="playground-history-rolls">
              {entry.rolls.map((pool, poolIndex) => (
                <span key={poolIndex} className="playground-history-pool">
                  [{pool.join(', ')}]
                </span>
              ))}
            </div>
            <div className="playground-history-desc">{entry.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
