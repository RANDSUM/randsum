import './ModifierReference.css'

export interface ModifierReferenceCell {
  readonly notation: string
  readonly description: string
  readonly isCore: boolean
}

interface ModifierEntry {
  readonly notation: string
  readonly description: string
}

type GridRow = readonly [ModifierEntry | 'CORE', ModifierEntry]

const CORE: ModifierEntry = { notation: 'xDY', description: 'roll x dice with Y sides' }

const GRID_ROWS: readonly GridRow[] = [
  ['CORE', { notation: 'D{..}', description: 'drop condition...' }],
  [
    { notation: 'L', description: 'drop lowest' },
    { notation: 'V{..}', description: 'replace...' }
  ],
  [
    { notation: 'H', description: 'drop highest' },
    { notation: 'S{..}', description: 'successes...' }
  ],
  [
    { notation: 'K', description: 'keep highest' },
    { notation: '+', description: 'add' }
  ],
  [
    { notation: 'kl', description: 'keep lowest' },
    { notation: '\u2013', description: 'subtract' }
  ],
  [
    { notation: '!', description: 'explode' },
    { notation: '*', description: 'multiply dice' }
  ],
  [
    { notation: '!!', description: 'compound' },
    { notation: '**', description: 'multiply total' }
  ],
  [
    { notation: '!p', description: 'penetrate' },
    { notation: 'C{..}', description: 'cap...' }
  ],
  [
    { notation: 'U', description: 'unique' },
    { notation: 'R{..}', description: 'reroll...' }
  ]
] as const

export function ModifierReference({
  coreDisabled = false,
  modifiersDisabled = false,
  onCellClick
}: {
  readonly coreDisabled?: boolean
  readonly modifiersDisabled?: boolean
  readonly onCellClick?: (cell: ModifierReferenceCell) => void
} = {}): React.JSX.Element {
  const coreInteractive = !coreDisabled && onCellClick !== undefined
  const cellsInteractive = !modifiersDisabled && onCellClick !== undefined

  return (
    <div className="modifier-reference not-content">
      <div className="modifier-reference-grid">
        {GRID_ROWS.map(([left, right]) => {
          const isCore = left === 'CORE'
          const leftEntry = isCore ? CORE : left
          const rowKey = isCore ? 'CORE' : leftEntry.notation
          const leftInteractive = isCore ? coreInteractive : cellsInteractive
          const leftDisabled = isCore ? coreDisabled : modifiersDisabled

          return (
            <div key={rowKey} className="modifier-reference-row">
              <div
                className={[
                  'modifier-reference-cell modifier-reference-cell--left',
                  isCore ? 'modifier-reference-cell--core' : '',
                  leftInteractive ? 'modifier-reference-cell--interactive' : '',
                  leftDisabled ? 'modifier-reference--disabled' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                role={leftInteractive ? 'button' : undefined}
                tabIndex={leftInteractive ? 0 : undefined}
                onClick={
                  leftInteractive
                    ? () => {
                        onCellClick?.({ ...leftEntry, isCore })
                      }
                    : undefined
                }
                onKeyDown={
                  leftInteractive
                    ? e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onCellClick?.({ ...leftEntry, isCore })
                        }
                      }
                    : undefined
                }
              >
                <span className="modifier-reference-notation">{leftEntry.notation}</span>
                <span
                  className={isCore ? 'modifier-reference-core-desc' : 'modifier-reference-desc'}
                >
                  {leftEntry.description}
                </span>
              </div>
              <div
                className={[
                  'modifier-reference-cell modifier-reference-cell--right',
                  cellsInteractive ? 'modifier-reference-cell--interactive' : '',
                  modifiersDisabled ? 'modifier-reference--disabled' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                role={cellsInteractive ? 'button' : undefined}
                tabIndex={cellsInteractive ? 0 : undefined}
                onClick={
                  cellsInteractive
                    ? () => {
                        onCellClick({ ...right, isCore: false })
                      }
                    : undefined
                }
                onKeyDown={
                  cellsInteractive
                    ? e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onCellClick({ ...right, isCore: false })
                        }
                      }
                    : undefined
                }
              >
                <span className="modifier-reference-desc">{right.description}</span>
                <span className="modifier-reference-notation">{right.notation}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
