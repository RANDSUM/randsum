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

// ---- Sections matching the notation spec taxonomy ----

const DICE_TYPES: readonly ReferenceEntry[] = [
  { key: 'NdS', notation: 'NdS', description: 'Roll N dice with S sides' },
  { key: 'd%', notation: 'd%', description: 'Percentile (1d100)' },
  { key: 'dF', notation: 'dF / dF.2', description: 'Fate / Fudge die' },
  { key: 'gN', notation: 'gN', description: 'Geometric (roll until 1)' },
  { key: 'DDN', notation: 'DDN', description: 'Draw (no replacement)' },
  { key: 'zN', notation: 'zN', description: 'Zero-bias (0 to N-1)' },
  { key: 'd{...}', notation: 'd{a,b,c}', description: 'Custom faces' }
]

const VALUE_MODIFIERS: readonly string[] = ['C{..}', 'V{..}']

const POOL_MODIFIERS: readonly string[] = ['L', 'H', 'D{..}', 'K', 'KL', 'R{..}', 'U']

const EXPLOSION_FAMILY: readonly string[] = ['!', '!!', '!p']

const TOTAL_MODIFIERS: readonly string[] = ['*', '+', '-', '//', '%', '**']

const COUNTING_MODIFIERS: readonly string[] = ['S{..}']

const DISPLAY_META: readonly ReferenceEntry[] = [
  { key: 'sa/sd', notation: 'sa / sd', description: 'Sort ascending / descending' },
  { key: '[text]', notation: '[text]', description: 'Annotation / label' },
  { key: 'xN', notation: 'xN', description: 'Repeat N times' }
]

// ---- Styles ----

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
  padding: '2px var(--pg-space-sm)',
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

// ---- Sub-components ----

function Section({
  label,
  children
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.ReactElement {
  return (
    <div>
      <div style={sectionHeaderStyle}>{label}</div>
      {children}
    </div>
  )
}

function EntryRow({
  entryKey,
  notation,
  description,
  isSelected,
  onSelect
}: {
  readonly entryKey: string
  readonly notation: string
  readonly description: string
  readonly isSelected: boolean
  readonly onSelect: (key: string) => void
}): React.ReactElement {
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

function ModifierEntries({
  keys,
  selectedEntry,
  onSelect
}: {
  readonly keys: readonly string[]
  readonly selectedEntry: string | null
  readonly onSelect: (key: string) => void
}): React.ReactElement {
  return (
    <>
      {keys.map(key => (
        <EntryRow
          key={key}
          entryKey={key}
          notation={MODIFIER_DOCS[key].displayBase}
          description={MODIFIER_DOCS[key].title}
          isSelected={selectedEntry === key}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

// ---- Main component ----

export function QuickReferenceGrid({
  selectedEntry,
  onSelect
}: QuickReferenceGridProps): React.ReactElement {
  return (
    <div style={{ fontFamily: 'var(--pg-font-body)' }}>
      <style>{RESPONSIVE_STYLES}</style>

      <Section label="Dice Types">
        {DICE_TYPES.map(entry => (
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

      <Section label="Value Modifiers">
        <ModifierEntries keys={VALUE_MODIFIERS} selectedEntry={selectedEntry} onSelect={onSelect} />
      </Section>

      <Section label="Pool Modifiers">
        <ModifierEntries keys={POOL_MODIFIERS} selectedEntry={selectedEntry} onSelect={onSelect} />
      </Section>

      <Section label="Explosion">
        <ModifierEntries
          keys={EXPLOSION_FAMILY}
          selectedEntry={selectedEntry}
          onSelect={onSelect}
        />
      </Section>

      <Section label="Arithmetic">
        <ModifierEntries keys={TOTAL_MODIFIERS} selectedEntry={selectedEntry} onSelect={onSelect} />
      </Section>

      <Section label="Counting">
        <ModifierEntries
          keys={COUNTING_MODIFIERS}
          selectedEntry={selectedEntry}
          onSelect={onSelect}
        />
      </Section>

      <Section label="Display &amp; Meta">
        {DISPLAY_META.map(entry => (
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
