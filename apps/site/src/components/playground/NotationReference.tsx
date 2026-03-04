import { useState } from 'react'

interface NotationEntry {
  readonly syntax: string
  readonly description: string
  readonly example: string
}

const NOTATION_ENTRIES: readonly NotationEntry[] = [
  { syntax: 'NdS', description: 'Roll N dice with S sides', example: '4d6' },
  { syntax: '+X', description: 'Add X to total', example: '1d20+5' },
  { syntax: '-X', description: 'Subtract X from total', example: '2d6-1' },
  { syntax: 'L', description: 'Drop lowest die', example: '4d6L' },
  { syntax: 'H', description: 'Drop highest die', example: '2d20H' },
  {
    syntax: 'K{N}',
    description: 'Keep N dice (highest)',
    example: '5d10K{3}'
  },
  {
    syntax: 'R{<N}',
    description: 'Reroll dice below N',
    example: '4d6R{<3}'
  },
  {
    syntax: 'C{>N}',
    description: 'Cap dice at maximum N',
    example: '3d8C{>6}'
  },
  {
    syntax: 'V{N=M}',
    description: 'Replace value N with M',
    example: '4d6V{1=6}'
  },
  {
    syntax: 'S{N}',
    description: 'Count successes >= N',
    example: '5d10S{7}'
  },
  { syntax: '!', description: 'Exploding dice', example: '3d6!' },
  { syntax: '!!', description: 'Compounding dice', example: '3d6!!' },
  { syntax: '!p', description: 'Penetrating dice', example: '3d6!p' },
  {
    syntax: 'U',
    description: 'Unique results (no duplicates)',
    example: '4d6U'
  },
  { syntax: '*N', description: 'Multiply dice sum by N', example: '2d6*2' },
  {
    syntax: '**N',
    description: 'Multiply final total by N',
    example: '2d6+3**2'
  }
] as const

export function NotationReference(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="playground-reference">
      <button
        onClick={() => {
          setIsOpen(prev => !prev)
        }}
        className="playground-reference-toggle"
        type="button"
      >
        Notation Reference {isOpen ? '\u25B2' : '\u25BC'}
      </button>
      <div className="playground-reference-desktop" aria-hidden={false}>
        <ReferenceTable />
      </div>
      {isOpen && (
        <div className="playground-reference-mobile">
          <ReferenceTable />
        </div>
      )}
    </div>
  )
}

function ReferenceTable(): React.JSX.Element {
  return (
    <div className="playground-reference-table">
      {NOTATION_ENTRIES.map(entry => (
        <div key={entry.syntax} className="playground-reference-row">
          <code className="playground-reference-syntax">{entry.syntax}</code>
          <div className="playground-reference-info">
            <span className="playground-reference-desc">{entry.description}</span>
            <code className="playground-reference-example">{entry.example}</code>
          </div>
        </div>
      ))}
    </div>
  )
}
