import { MODIFIER_DOCS } from '@randsum/display-utils'

interface QuickReferenceGridProps {
  readonly selectedEntry: string | null
  readonly onSelect: (entryKey: string) => void
}

interface ReferenceEntry {
  readonly key: string
  readonly notation: string
  readonly description: string
}

const CORE_DICE_ENTRIES: readonly ReferenceEntry[] = [
  { key: 'NdS', notation: 'NdS', description: 'Roll N dice with S sides' },
  { key: 'd%', notation: 'd%', description: 'Percentile die (1-100)' },
  { key: 'dF', notation: 'dF / dF.2', description: 'Fate / Extended Fudge die' },
  { key: 'gN', notation: 'gN', description: 'Geometric die (roll until 1)' },
  { key: 'DDN', notation: 'DDN', description: 'Draw die (no replacement)' },
  { key: 'zN', notation: 'zN', description: 'Zero-bias die (0 to N-1)' },
  { key: 'd{...}', notation: 'd{a,b,c}', description: 'Custom faces die' }
]

const OPERATOR_ENTRIES: readonly ReferenceEntry[] = [
  { key: 'xN', notation: 'xN', description: 'Repeat (roll N times)' },
  { key: '[text]', notation: '[text]', description: 'Annotation / label' }
]

// Scoped responsive styles — class names are local to QuickReferenceGrid
const RESPONSIVE_STYLES = `
  .qrg-entry-row {
    display: grid;
    grid-template-columns: minmax(80px, auto) 1fr;
    gap: var(--pg-space-xs);
    padding: 2px var(--pg-space-sm);
    cursor: pointer;
    align-items: baseline;
    line-height: 1.4;
  }
  .qrg-entry-row:hover {
    background-color: var(--pg-color-surface-alt);
  }
  @media (max-width: 480px) {
    .qrg-entry-row {
      grid-template-columns: 1fr;
    }
    .qrg-entry-description {
      display: none;
    }
  }
`

const sectionHeaderStyle: React.CSSProperties = {
  padding: 'var(--pg-space-xs) var(--pg-space-sm)',
  paddingTop: 'var(--pg-space-sm)',
  fontSize: '0.7rem',
  fontFamily: 'var(--pg-font-body)',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--pg-color-text-dim)',
  cursor: 'default',
  userSelect: 'none'
}

const notationCellStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-mono)',
  fontSize: '0.78rem',
  color: 'var(--pg-color-accent-high)'
}

const descriptionCellStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--pg-color-text-muted)'
}

interface SectionProps {
  readonly label: string
  readonly children: React.ReactNode
}

function Section({ label, children }: SectionProps): React.ReactElement {
  return (
    <div>
      <div style={sectionHeaderStyle}>{label}</div>
      {children}
    </div>
  )
}

interface EntryRowProps {
  readonly entryKey: string
  readonly notation: string
  readonly description: string
  readonly isSelected: boolean
  readonly onSelect: (key: string) => void
}

function EntryRow({
  entryKey,
  notation,
  description,
  isSelected,
  onSelect
}: EntryRowProps): React.ReactElement {
  const selectedStyle: React.CSSProperties = isSelected
    ? { backgroundColor: 'var(--pg-color-surface-alt)' }
    : {}

  return (
    <div
      role="button"
      tabIndex={0}
      className="qrg-entry-row"
      style={selectedStyle}
      onClick={() => {
        onSelect(entryKey)
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(entryKey)
        }
      }}
    >
      <span style={notationCellStyle}>{notation}</span>
      <span className="qrg-entry-description" style={descriptionCellStyle}>
        {description}
      </span>
    </div>
  )
}

export function QuickReferenceGrid({
  selectedEntry,
  onSelect
}: QuickReferenceGridProps): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: 'var(--pg-font-body)'
      }}
    >
      <style>{RESPONSIVE_STYLES}</style>

      <Section label="Core Dice">
        {CORE_DICE_ENTRIES.map(entry => (
          <EntryRow
            key={entry.key}
            entryKey={entry.key}
            notation={entry.notation}
            description={entry.description}
            isSelected={selectedEntry === entry.key}
            onSelect={onSelect}
          />
        ))}
      </Section>

      <Section label="Modifiers">
        {Object.entries(MODIFIER_DOCS).map(([key, doc]) => (
          <EntryRow
            key={key}
            entryKey={key}
            notation={doc.displayBase}
            description={doc.title}
            isSelected={selectedEntry === key}
            onSelect={onSelect}
          />
        ))}
      </Section>

      <Section label="Operators">
        {OPERATOR_ENTRIES.map(entry => (
          <EntryRow
            key={entry.key}
            entryKey={entry.key}
            notation={entry.notation}
            description={entry.description}
            isSelected={selectedEntry === entry.key}
            onSelect={onSelect}
          />
        ))}
      </Section>
    </div>
  )
}
