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

type ModifierPair = readonly [ModifierEntry, ModifierEntry]

const MODIFIER_PAIRS: readonly ModifierPair[] = [
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
    { notation: '**', description: 'multiply total' }
  ],
  [
    { notation: 'kl', description: 'keep lowest' },
    { notation: '*', description: 'multiply dice' }
  ],
  [
    { notation: '!', description: 'explode' },
    { notation: '\u2013', description: 'subtract' }
  ],
  [
    { notation: '!!', description: 'compound' },
    { notation: '+', description: 'add' }
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

const CORE: ModifierEntry = { notation: 'xDY', description: 'roll x dice with Y sides' }

export function ModifierReference({
  corePosition = 'top',
  coreDisabled = false,
  modifiersDisabled = false,
  onCellClick
}: {
  readonly corePosition?: 'top' | 'bottom'
  readonly coreDisabled?: boolean
  readonly modifiersDisabled?: boolean
  readonly onCellClick?: (cell: ModifierReferenceCell) => void
} = {}): React.JSX.Element {
  const handleCoreClick = (): void => {
    onCellClick?.({ ...CORE, isCore: true })
  }

  const coreRow = (
    <div
      className={[
        'modifier-reference-core',
        corePosition === 'top' ? 'modifier-reference-core--top' : '',
        coreDisabled ? 'modifier-reference--disabled' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      role={coreDisabled ? undefined : 'button'}
      tabIndex={coreDisabled ? undefined : 0}
      onClick={coreDisabled ? undefined : handleCoreClick}
      onKeyDown={
        coreDisabled
          ? undefined
          : e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCoreClick()
              }
            }
      }
    >
      <span className="modifier-reference-notation">{CORE.notation}</span>
      <span className="modifier-reference-core-desc">{CORE.description}</span>
    </div>
  )

  return (
    <div className="modifier-reference">
      {corePosition === 'top' && coreRow}
      <div
        className={`modifier-reference-grid${modifiersDisabled ? ' modifier-reference--disabled' : ''}`}
      >
        {MODIFIER_PAIRS.map(([left, right]) => (
          <div key={left.notation} className="modifier-reference-row">
            <div
              className="modifier-reference-cell modifier-reference-cell--left"
              role={modifiersDisabled ? undefined : 'button'}
              tabIndex={modifiersDisabled ? undefined : 0}
              onClick={
                modifiersDisabled ? undefined : () => onCellClick?.({ ...left, isCore: false })
              }
              onKeyDown={
                modifiersDisabled
                  ? undefined
                  : e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onCellClick?.({ ...left, isCore: false })
                      }
                    }
              }
            >
              <span className="modifier-reference-notation">{left.notation}</span>
              <span className="modifier-reference-desc">{left.description}</span>
            </div>
            <div
              className="modifier-reference-cell modifier-reference-cell--right"
              role={modifiersDisabled ? undefined : 'button'}
              tabIndex={modifiersDisabled ? undefined : 0}
              onClick={
                modifiersDisabled ? undefined : () => onCellClick?.({ ...right, isCore: false })
              }
              onKeyDown={
                modifiersDisabled
                  ? undefined
                  : e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onCellClick?.({ ...right, isCore: false })
                      }
                    }
              }
            >
              <span className="modifier-reference-desc">{right.description}</span>
              <span className="modifier-reference-notation">{right.notation}</span>
            </div>
          </div>
        ))}
      </div>
      {corePosition === 'bottom' && coreRow}
    </div>
  )
}
