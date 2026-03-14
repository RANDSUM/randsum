import './ModifierReference.css'
import { ErrorBoundary } from '../ErrorBoundary'

export interface ModifierReferenceCell {
  readonly notation: string
  readonly description: string
  readonly isCore: boolean
}

interface ModifierEntry {
  readonly notation: string
  readonly description: string
  /** Suffix shown after the notation key. If required=true, rendered at full opacity; false = dimmed. */
  readonly notationSuffix?: string
  readonly notationSuffixRequired?: boolean
}

type GridRow = readonly [ModifierEntry | 'CORE', ModifierEntry]

const CORE: ModifierEntry = { notation: 'xDN', description: 'roll x dice with N sides' }

const GRID_ROWS: readonly GridRow[] = [
  [
    'CORE',
    { notation: '+', description: 'add', notationSuffix: 'N', notationSuffixRequired: true }
  ],
  [
    { notation: 'L', description: 'drop lowest', notationSuffix: 'N' },
    {
      notation: '\u2013',
      description: 'subtract',
      notationSuffix: 'N',
      notationSuffixRequired: true
    }
  ],
  [
    { notation: 'H', description: 'drop highest', notationSuffix: 'N' },
    {
      notation: '*',
      description: 'multiply dice',
      notationSuffix: 'N',
      notationSuffixRequired: true
    }
  ],
  [
    { notation: 'K', description: 'keep highest', notationSuffix: 'N' },
    {
      notation: '**',
      description: 'multiply total',
      notationSuffix: 'N',
      notationSuffixRequired: true
    }
  ],
  [
    { notation: 'KL', description: 'keep lowest', notationSuffix: 'N' },
    { notation: 'V{..}', description: 'replace...' }
  ],
  [
    { notation: '!', description: 'explode' },
    { notation: 'S{..}', description: 'successes...' }
  ],
  [
    { notation: '!!', description: 'compound', notationSuffix: 'N' },
    { notation: 'D{..}', description: 'drop condition...' }
  ],
  [
    { notation: '!p', description: 'penetrate', notationSuffix: 'N' },
    { notation: 'C{..}', description: 'cap...' }
  ],
  [
    { notation: 'U', description: 'unique', notationSuffix: '{..}' },
    { notation: 'R{..}', description: 'reroll...', notationSuffix: 'N' }
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
    <ErrorBoundary>
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
                  <span className="modifier-reference-notation">
                    {leftEntry.notation}
                    {leftEntry.notationSuffix && (
                      <span
                        className={
                          leftEntry.notationSuffixRequired
                            ? 'modifier-reference-notation-suffix--required'
                            : 'modifier-reference-notation-suffix--optional'
                        }
                      >
                        {leftEntry.notationSuffix}
                      </span>
                    )}
                  </span>
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
                  <span className="modifier-reference-notation">
                    {right.notation}
                    {right.notationSuffix && (
                      <span
                        className={
                          right.notationSuffixRequired
                            ? 'modifier-reference-notation-suffix--required'
                            : 'modifier-reference-notation-suffix--optional'
                        }
                      >
                        {right.notationSuffix}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ErrorBoundary>
  )
}
