import { MODIFIER_DOCS } from '@randsum/roller/docs'
import type { NotationDoc } from '@randsum/roller/docs'

interface QuickReferenceGridProps {
  readonly selectedEntry: string | null
  readonly onSelect: (entryKey: string) => void
}

interface ReferenceEntry {
  readonly key: string
  readonly notation: string
  readonly description: string
  readonly detail?: InlineDetail
}

interface InlineDetail {
  readonly fullDescription: string
  readonly examples: readonly { readonly notation: string; readonly description: string }[]
}

// ---- Sections matching the notation spec taxonomy ----

const DICE_TYPES: readonly ReferenceEntry[] = [
  {
    key: 'NdS',
    notation: 'NdS',
    description: 'Roll N dice with S sides',
    detail: {
      fullDescription: 'The foundation of every notation string. Roll N dice, each with S sides.',
      examples: [
        { notation: '1d20', description: 'Roll one twenty-sided die' },
        { notation: '4d6', description: 'Roll four six-sided dice' },
        { notation: '2d8', description: 'Roll two eight-sided dice' }
      ]
    }
  },
  {
    key: 'd%',
    notation: 'd%',
    description: 'Percentile (1d100)',
    detail: {
      fullDescription: 'Shorthand for a 100-sided die. Equivalent to 1d100.',
      examples: [{ notation: 'd%', description: 'Roll 1-100' }]
    }
  },
  {
    key: 'dF',
    notation: 'dF / dF.2',
    description: 'Fate / Fudge die',
    detail: {
      fullDescription:
        'Fate dice show -1, 0, or +1. dF.2 is the extended Fudge variant (-2 to +2).',
      examples: [
        { notation: '4dF', description: 'Fate Core: four Fate dice (-4 to +4)' },
        { notation: 'dF.2', description: 'Extended Fudge die (-2 to +2)' }
      ]
    }
  },
  {
    key: 'gN',
    notation: 'gN',
    description: 'Geometric (roll until 1)',
    detail: {
      fullDescription:
        'Roll an N-sided die repeatedly until a 1 appears. Total is the count of rolls.',
      examples: [{ notation: 'g6', description: 'Geometric d6 — roll until 1' }]
    }
  },
  {
    key: 'DDN',
    notation: 'DDN',
    description: 'Draw (no replacement)',
    detail: {
      fullDescription:
        'Draw dice from a pool without replacement — each value can only appear once.',
      examples: [{ notation: '3DD6', description: 'Draw 3 unique values from 1-6' }]
    }
  },
  {
    key: 'zN',
    notation: 'zN',
    description: 'Zero-bias (0 to N-1)',
    detail: {
      fullDescription: 'A zero-indexed die that rolls 0 through N-1 instead of 1 through N.',
      examples: [{ notation: 'z6', description: 'Roll 0-5 instead of 1-6' }]
    }
  },
  {
    key: 'd{...}',
    notation: 'd{a,b,c}',
    description: 'Custom faces',
    detail: {
      fullDescription: 'A die with custom face values. Faces can be any values.',
      examples: [
        { notation: 'd{1,2,2,3,3,4}', description: 'Weighted custom die' },
        { notation: 'd{H,T}', description: 'Coin flip (heads/tails)' }
      ]
    }
  }
]

const VALUE_MODIFIERS: readonly string[] = ['C{..}', 'V{..}']

const POOL_MODIFIERS: readonly string[] = [
  'L',
  'H',
  'D{..}',
  'K',
  'KL',
  'KM',
  'R{..}',
  'ro{..}',
  'U',
  '!',
  '!!',
  '!p',
  '!s{..}',
  '!i',
  '!r',
  'W'
]

const TOTAL_MODIFIERS: readonly string[] = ['*', '+', '-', '//', '%', '**', 'ms{..}']

const COUNTING_MODIFIERS: readonly string[] = ['#{..}', 'S{..}', 'F{..}']

const DISPLAY_META: readonly ReferenceEntry[] = [
  {
    key: 'sa/sd',
    notation: 'sa / sd',
    description: 'Sort ascending / descending',
    detail: {
      fullDescription: 'Sort the dice pool in ascending or descending order for display.',
      examples: [
        { notation: '4d6sa', description: 'Roll 4d6, display sorted low to high' },
        { notation: '4d6sd', description: 'Roll 4d6, display sorted high to low' }
      ]
    }
  },
  {
    key: '[text]',
    notation: '[text]',
    description: 'Annotation / label',
    detail: {
      fullDescription: 'Attach a label or note to the roll. Does not affect the result.',
      examples: [
        { notation: '2d6+3[fire]', description: 'Label the roll as fire damage' },
        { notation: '1d20+5[attack]', description: 'Label as an attack roll' }
      ]
    }
  },
  {
    key: 'xN',
    notation: 'xN',
    description: 'Repeat N times',
    detail: {
      fullDescription: 'Roll the entire expression N times, producing N independent results.',
      examples: [
        { notation: '4d6Lx6', description: 'Roll ability scores (4d6 drop lowest, 6 times)' },
        { notation: '1d20+5x3', description: 'Three attack rolls' }
      ]
    }
  }
]

// ---- Styles ----

const RESPONSIVE_STYLES = `
  .qrg-masonry {
    display: flex;
    flex-direction: column;
    gap: var(--pg-space-sm);
  }
  @media (min-width: 640px) {
    .qrg-masonry {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
    .qrg-col {
      display: flex;
      flex-direction: column;
      gap: var(--pg-space-sm);
    }
  }
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
  .qrg-entry-wrap:nth-child(odd) > .qrg-entry-row {
    background-color: color-mix(in srgb, var(--pg-color-surface-alt) 40%, transparent);
  }
  .qrg-entry-wrap:nth-child(odd) > .qrg-entry-row:hover {
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

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--pg-color-surface)',
  border: '1px solid var(--pg-color-border)',
  borderRadius: 'var(--pg-radius-md)',
  marginBottom: 'var(--pg-space-sm)',
  overflow: 'hidden'
}

const sectionHeaderStyle: React.CSSProperties = {
  padding: 'var(--pg-space-sm)',
  fontSize: '0.7rem',
  fontFamily: 'var(--pg-font-body)',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--pg-color-text-dim)',
  backgroundColor: 'var(--pg-color-surface-alt)',
  borderBottom: '1px solid var(--pg-color-border)',
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

// ---- Inline detail styles ----

const detailContainerStyle: React.CSSProperties = {
  padding: 'var(--pg-space-xs) var(--pg-space-sm) var(--pg-space-sm)',
  backgroundColor: 'var(--pg-color-surface-alt)',
  borderTop: '1px solid var(--pg-color-border)',
  fontSize: '0.78rem'
}

const detailDescStyle: React.CSSProperties = {
  color: 'var(--pg-color-text-muted)',
  lineHeight: 1.5,
  margin: '0 0 var(--pg-space-xs) 0'
}

const detailExamplesStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

const detailExampleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--pg-space-sm)'
}

const detailCodeStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-mono)',
  color: 'var(--pg-color-accent-high)',
  flexShrink: 0
}

const detailExampleDescStyle: React.CSSProperties = {
  color: 'var(--pg-color-text-dim)'
}

const detailFormsStyle: React.CSSProperties = {
  margin: '0 0 var(--pg-space-xs) 0',
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

const detailFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--pg-space-sm)'
}

const detailFormNotationStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-mono)',
  color: 'var(--pg-color-accent-high)',
  flexShrink: 0
}

const detailFormNoteStyle: React.CSSProperties = {
  color: 'var(--pg-color-text-dim)'
}

const detailSectionLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontFamily: 'var(--pg-font-mono)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--pg-color-text-dim)',
  margin: 'var(--pg-space-xs) 0 2px 0'
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
    <div style={cardStyle}>
      <div style={sectionHeaderStyle}>{label}</div>
      {children}
    </div>
  )
}

function InlineModifierDetail({ doc }: { readonly doc: NotationDoc }): React.ReactElement {
  return (
    <div style={detailContainerStyle}>
      <p style={detailDescStyle}>{doc.description}</p>

      <div style={detailSectionLabelStyle}>Forms</div>
      <ul style={detailFormsStyle}>
        {doc.forms.map((form, i) => (
          <li key={i} style={detailFormStyle}>
            <code style={detailFormNotationStyle}>{form.notation}</code>
            <span style={detailFormNoteStyle}>{form.note}</span>
          </li>
        ))}
      </ul>

      {doc.comparisons !== undefined && doc.comparisons.length > 0 && (
        <>
          <div style={detailSectionLabelStyle}>Operators</div>
          <ul style={detailFormsStyle}>
            {doc.comparisons.map((c, i) => (
              <li key={i} style={detailFormStyle}>
                <code style={detailFormNotationStyle}>{c.operator}</code>
                <span style={detailFormNoteStyle}>{c.note}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={detailSectionLabelStyle}>Examples</div>
      <ul style={detailExamplesStyle}>
        {doc.examples.map((ex, i) => (
          <li key={i} style={detailExampleStyle}>
            <code style={detailCodeStyle}>{ex.notation}</code>
            <span style={detailExampleDescStyle}>{ex.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InlineCustomDetail({ detail }: { readonly detail: InlineDetail }): React.ReactElement {
  return (
    <div style={detailContainerStyle}>
      <p style={detailDescStyle}>{detail.fullDescription}</p>
      <div style={detailSectionLabelStyle}>Examples</div>
      <ul style={detailExamplesStyle}>
        {detail.examples.map((ex, i) => (
          <li key={i} style={detailExampleStyle}>
            <code style={detailCodeStyle}>{ex.notation}</code>
            <span style={detailExampleDescStyle}>{ex.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EntryRow({
  entryKey,
  notation,
  description,
  isExpanded,
  onSelect,
  children
}: {
  readonly entryKey: string
  readonly notation: string
  readonly description: string
  readonly isExpanded: boolean
  readonly onSelect: (key: string) => void
  readonly children?: React.ReactNode
}): React.ReactElement {
  const selectedStyle: React.CSSProperties = isExpanded
    ? { backgroundColor: 'var(--pg-color-surface-alt)' }
    : {}

  return (
    <div className="qrg-entry-wrap">
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
      {isExpanded && children}
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
          isExpanded={selectedEntry === key}
          onSelect={onSelect}
        >
          <InlineModifierDetail doc={MODIFIER_DOCS[key]} />
        </EntryRow>
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
    <div className="qrg-masonry" style={{ fontFamily: 'var(--pg-font-body)' }}>
      <style>{RESPONSIVE_STYLES}</style>

      <div className="qrg-col">
        <Section label="Dice Types">
          {DICE_TYPES.map(entry => (
            <EntryRow
              key={entry.key}
              entryKey={entry.key}
              notation={entry.notation}
              description={entry.description}
              isExpanded={selectedEntry === entry.key}
              onSelect={onSelect}
            >
              {entry.detail !== undefined && <InlineCustomDetail detail={entry.detail} />}
            </EntryRow>
          ))}
        </Section>

        <Section label="Value Modifiers">
          <ModifierEntries
            keys={VALUE_MODIFIERS}
            selectedEntry={selectedEntry}
            onSelect={onSelect}
          />
        </Section>

        <Section label="Pool Modifiers">
          <ModifierEntries
            keys={POOL_MODIFIERS}
            selectedEntry={selectedEntry}
            onSelect={onSelect}
          />
        </Section>
      </div>

      <div className="qrg-col">
        <Section label="Arithmetic">
          <ModifierEntries
            keys={TOTAL_MODIFIERS}
            selectedEntry={selectedEntry}
            onSelect={onSelect}
          />
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
              isExpanded={selectedEntry === entry.key}
              onSelect={onSelect}
            >
              {entry.detail !== undefined && <InlineCustomDetail detail={entry.detail} />}
            </EntryRow>
          ))}
        </Section>
      </div>
    </div>
  )
}
