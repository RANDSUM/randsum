import { useCallback, useMemo, useState } from 'react'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { ModifierCategory, NotationDoc } from '@randsum/roller/docs'
import { useTheme } from './useTheme'

// ---- Props ----

interface QuickReferenceGridProps {
  readonly notation: string
  readonly selectedEntry: string | null
  readonly onSelect: (entryKey: string) => void
  readonly onAdd: (fragment: string) => void
}

// ---- Builder type system ----

type BuilderType =
  | { readonly kind: 'dice' }
  | { readonly kind: 'no-arg'; readonly fragment: string }
  | { readonly kind: 'number'; readonly prefix: string; readonly actual: string }
  | { readonly kind: 'condition'; readonly prefix: string; readonly actual: string }

const NUMBER_KEYS = new Set(['K', 'KL', 'KM', '+', '-', '*', '//', '%', '**', 'ms{..}'])
const CONDITION_KEYS = new Set([
  'R{..}',
  'ro{..}',
  'C{..}',
  'V{..}',
  'D{..}',
  '#{..}',
  'S{..}',
  'F{..}',
  '!s{..}'
])
const DICE_SIDES_KEYS = new Set(['gN', 'DDN', 'zN'])

function getBuilderType(doc: NotationDoc): BuilderType {
  if (doc.key === 'xDN') return { kind: 'dice' }
  if (DICE_SIDES_KEYS.has(doc.key)) {
    const prefix = doc.displayBase.replace('N', '')
    return { kind: 'number', prefix, actual: prefix }
  }
  if (NUMBER_KEYS.has(doc.key)) {
    const actual = doc.key === '-' ? '-' : doc.key === 'ms{..}' ? 'ms' : doc.key
    return { kind: 'number', prefix: doc.displayBase, actual }
  }
  if (CONDITION_KEYS.has(doc.key)) {
    const actual = doc.key.replace('{..}', '')
    return { kind: 'condition', prefix: doc.displayBase.replace('{..}', ''), actual }
  }
  return { kind: 'no-arg', fragment: doc.key === 'sort' ? 'sa' : doc.key }
}

function canAddModifier(notation: string, doc: NotationDoc): boolean {
  if (doc.category === 'Core' || doc.category === 'Special') return true
  return notation.length > 0 && /\d*d[\d%F{]/i.test(notation)
}

// ---- Category grouping ----

const CATEGORY_ORDER: readonly ModifierCategory[] = [
  'Core',
  'Special',
  'Filter',
  'Generate',
  'Accumulate',
  'Substitute',
  'Clamp',
  'Map',
  'Reinterpret',
  'Scale',
  'Order',
  'Dispatch'
]

const CATEGORY_LABELS: Readonly<Record<ModifierCategory, string>> = {
  Core: 'Core Dice',
  Special: 'Special Dice',
  Filter: 'Filter',
  Generate: 'Generate',
  Accumulate: 'Accumulate',
  Substitute: 'Substitute',
  Clamp: 'Clamp',
  Map: 'Map',
  Reinterpret: 'Reinterpret',
  Scale: 'Scale',
  Order: 'Order',
  Dispatch: 'Dispatch'
}

function groupByCategory(): ReadonlyMap<ModifierCategory, readonly NotationDoc[]> {
  const groups = new Map<ModifierCategory, NotationDoc[]>()
  for (const doc of Object.values(NOTATION_DOCS)) {
    const existing = groups.get(doc.category)
    if (existing) {
      existing.push(doc)
    } else {
      groups.set(doc.category, [doc])
    }
  }
  return groups
}

// ---- CSS ----

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
  .qrg-overlay-backdrop {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    border-radius: var(--pg-radius-md);
  }
  [data-theme='light'] .qrg-overlay-backdrop,
  .qrg-overlay-backdrop--light {
    background: rgba(255, 255, 255, 0.5);
  }
  @media (prefers-color-scheme: light) {
    :root:not([data-theme='dark']) .qrg-overlay-backdrop {
      background: rgba(255, 255, 255, 0.5);
    }
  }
  .qrg-overlay-panel {
    position: absolute;
    inset: 0;
    z-index: 11;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--pg-space-lg) var(--pg-space-md);
    overflow-y: auto;
    pointer-events: none;
  }
  .qrg-overlay-content {
    pointer-events: auto;
    width: 100%;
    max-width: 28rem;
    background: var(--pg-color-surface);
    border: 1.5px solid var(--pg-color-border);
    border-radius: var(--pg-radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: qrg-modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  }
  [data-theme='light'] .qrg-overlay-content {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
  @media (prefers-color-scheme: light) {
    :root:not([data-theme='dark']) .qrg-overlay-content {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }
  }
  @keyframes qrg-modal-in {
    0% { opacity: 0; transform: scale(0.92); }
    100% { opacity: 1; transform: scale(1); }
  }
  .qrg-modal-header {
    display: flex;
    gap: var(--pg-space-md);
    padding: var(--pg-space-md);
    border-bottom: 1px solid var(--pg-color-border);
    align-items: flex-start;
  }
  @media (max-width: 480px) {
    .qrg-modal-header {
      flex-direction: column;
      gap: var(--pg-space-sm);
    }
  }
  .qrg-stepper {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .qrg-stepper-btn {
    background: var(--pg-color-surface-alt);
    border: 1px solid var(--pg-color-border);
    color: var(--pg-color-text-muted);
    font-size: 0.65rem;
    line-height: 1;
    padding: 2px 8px;
    cursor: pointer;
    user-select: none;
  }
  .qrg-stepper-btn:hover {
    background: var(--pg-color-border);
    color: var(--pg-color-text);
  }
  .qrg-stepper-btn:first-child {
    border-radius: var(--pg-radius-sm) var(--pg-radius-sm) 0 0;
  }
  .qrg-stepper-btn:last-child {
    border-radius: 0 0 var(--pg-radius-sm) var(--pg-radius-sm);
  }
  .qrg-stepper-value {
    background: var(--pg-color-bg);
    border-left: 1px solid var(--pg-color-border);
    border-right: 1px solid var(--pg-color-border);
    font-family: var(--pg-font-mono);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--pg-color-text);
    padding: 2px 10px;
    text-align: center;
    min-width: 2.5ch;
  }
  .qrg-add-btn {
    padding: var(--pg-space-xs) var(--pg-space-md);
    border: none;
    border-radius: var(--pg-radius-sm);
    font-family: var(--pg-font-mono);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .qrg-add-btn:disabled {
    background: var(--pg-color-surface-alt);
    color: var(--pg-color-text-dim);
    cursor: not-allowed;
  }
  .qrg-op-select {
    background: var(--pg-color-bg);
    border: 1px solid var(--pg-color-border);
    border-radius: var(--pg-radius-sm);
    color: var(--pg-color-text);
    font-family: var(--pg-font-mono);
    font-size: 0.78rem;
    padding: 2px 4px;
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

// ---- Stepper component ----

function NumericStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  accentColor
}: {
  readonly value: number
  readonly onChange: (v: number) => void
  readonly min?: number
  readonly max?: number
  readonly accentColor?: string
}): React.ReactElement {
  return (
    <div className="qrg-stepper">
      <button
        type="button"
        className="qrg-stepper-btn"
        onClick={() => {
          if (value < max) onChange(value + 1)
        }}
        aria-label="Increase"
      >
        +
      </button>
      <div className="qrg-stepper-value" style={accentColor ? { color: accentColor } : undefined}>
        {value}
      </div>
      <button
        type="button"
        className="qrg-stepper-btn"
        onClick={() => {
          if (value > min) onChange(value - 1)
        }}
        aria-label="Decrease"
      >
        &minus;
      </button>
    </div>
  )
}

// ---- Builder components ----

const OPERATORS = ['<', '>', '=', '<=', '>='] as const

function DiceBuilder({
  accentColor,
  onAdd,
  disabled
}: {
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.ReactElement {
  const [quantity, setQuantity] = useState(1)
  const [sides, setSides] = useState(6)
  const preview = `${quantity}d${sides}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--pg-space-md)',
        flexWrap: 'wrap'
      }}
    >
      <NumericStepper value={quantity} onChange={setQuantity} min={1} accentColor={accentColor} />
      <span style={{ fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-color-text-dim)' }}>
        d
      </span>
      <NumericStepper value={sides} onChange={setSides} min={2} accentColor={accentColor} />
      <button
        type="button"
        className="qrg-add-btn"
        disabled={disabled}
        style={!disabled ? { backgroundColor: accentColor, color: '#fff' } : undefined}
        onClick={() => {
          onAdd(preview)
        }}
      >
        Add {preview}
      </button>
    </div>
  )
}

function NumberBuilder({
  builder,
  accentColor,
  onAdd,
  disabled
}: {
  readonly builder: { readonly prefix: string; readonly actual: string }
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.ReactElement {
  const [value, setValue] = useState(1)
  const preview = `${builder.actual}${value}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pg-space-md)' }}>
      <span
        style={{
          fontFamily: 'var(--pg-font-mono)',
          fontWeight: 600,
          color: accentColor,
          fontSize: '0.85rem'
        }}
      >
        {builder.prefix}
      </span>
      <NumericStepper value={value} onChange={setValue} min={1} accentColor={accentColor} />
      <button
        type="button"
        className="qrg-add-btn"
        disabled={disabled}
        style={!disabled ? { backgroundColor: accentColor, color: '#fff' } : undefined}
        onClick={() => {
          onAdd(preview)
        }}
      >
        Add {preview}
      </button>
    </div>
  )
}

function ConditionBuilder({
  builder,
  accentColor,
  onAdd,
  disabled
}: {
  readonly builder: { readonly prefix: string; readonly actual: string }
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.ReactElement {
  const [op, setOp] = useState<string>('<')
  const [value, setValue] = useState(3)
  const preview = `${builder.actual}{${op}${value}}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--pg-space-sm)',
        flexWrap: 'wrap'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pg-font-mono)',
          fontWeight: 600,
          color: accentColor,
          fontSize: '0.85rem'
        }}
      >
        {builder.prefix}&#123;
      </span>
      <select
        className="qrg-op-select"
        value={op}
        onChange={e => {
          setOp(e.target.value as (typeof OPERATORS)[number])
        }}
      >
        {OPERATORS.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <NumericStepper value={value} onChange={setValue} min={1} accentColor={accentColor} />
      <span style={{ fontFamily: 'var(--pg-font-mono)', color: accentColor, fontSize: '0.85rem' }}>
        &#125;
      </span>
      <button
        type="button"
        className="qrg-add-btn"
        disabled={disabled}
        style={!disabled ? { backgroundColor: accentColor, color: '#fff' } : undefined}
        onClick={() => {
          onAdd(preview)
        }}
      >
        Add {preview}
      </button>
    </div>
  )
}

function NoArgBuilder({
  fragment,
  accentColor,
  onAdd,
  disabled
}: {
  readonly fragment: string
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      className="qrg-add-btn"
      disabled={disabled}
      style={!disabled ? { backgroundColor: accentColor, color: '#fff' } : undefined}
      onClick={() => {
        onAdd(fragment)
      }}
    >
      Add {fragment}
    </button>
  )
}

// ---- Section + EntryRow ----

function Section({
  label,
  color,
  children
}: {
  readonly label: string
  readonly color?: string
  readonly children: React.ReactNode
}): React.ReactElement {
  return (
    <div style={cardStyle}>
      <div style={sectionHeaderStyle}>
        {color !== undefined && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color,
              marginRight: '0.4em',
              verticalAlign: 'middle'
            }}
          />
        )}
        {label}
      </div>
      {children}
    </div>
  )
}

function EntryRow({
  doc,
  isSelected,
  onSelect,
  theme
}: {
  readonly doc: NotationDoc
  readonly isSelected: boolean
  readonly onSelect: (key: string) => void
  readonly theme: 'light' | 'dark'
}): React.ReactElement {
  const accentColor = theme === 'light' ? doc.colorLight : doc.color
  const notationColor = isSelected ? accentColor : 'var(--pg-color-accent-high)'

  return (
    <div className="qrg-entry-wrap">
      <div
        role="button"
        tabIndex={0}
        className="qrg-entry-row"
        style={isSelected ? { backgroundColor: 'var(--pg-color-surface-alt)' } : undefined}
        onClick={() => {
          onSelect(doc.key)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(doc.key)
          }
        }}
      >
        <span
          style={{
            fontFamily: 'var(--pg-font-mono)',
            fontSize: '0.78rem',
            transition: 'color 0.15s ease',
            color: notationColor
          }}
        >
          {doc.displayBase}
        </span>
        <span
          className="qrg-entry-description"
          style={{ fontSize: '0.78rem', color: 'var(--pg-color-text-muted)' }}
        >
          {doc.title}
        </span>
      </div>
    </div>
  )
}

// ---- DocModal ----

function DocModal({
  doc,
  accentColor,
  notation,
  onClose,
  onAdd
}: {
  readonly doc: NotationDoc
  readonly accentColor: string
  readonly notation: string
  readonly onClose: () => void
  readonly onAdd: (fragment: string) => void
}): React.ReactElement {
  const builder = getBuilderType(doc)
  const canAdd = canAddModifier(notation, doc)

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--pg-font-mono)',
    color: accentColor,
    flexShrink: 0
  }

  const handleAdd = useCallback(
    (fragment: string) => {
      onAdd(fragment)
    },
    [onAdd]
  )

  return (
    <>
      <div className="qrg-overlay-backdrop" onClick={onClose} />
      <div className="qrg-overlay-panel">
        <div className="qrg-overlay-content" style={{ borderColor: accentColor }}>
          {/* Header: big notation pane + title/description */}
          <div className="qrg-modal-header">
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '3.5rem',
                padding: 'var(--pg-space-sm) var(--pg-space-md)',
                border: `1px solid ${accentColor}40`,
                borderRadius: 'var(--pg-radius-md)',
                fontFamily: 'var(--pg-font-mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: accentColor,
                lineHeight: 1
              }}
            >
              {doc.displayBase}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--pg-color-text)',
                  marginBottom: '0.2em'
                }}
              >
                {doc.title}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--pg-color-text-muted)',
                  lineHeight: 1.5
                }}
              >
                {doc.description}
              </div>
            </div>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--pg-color-text-dim)',
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: '0.1rem 0.25rem',
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: 'auto'
              }}
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Forms + Examples */}
          <div style={{ padding: 'var(--pg-space-sm) var(--pg-space-md)', fontSize: '0.78rem' }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--pg-font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pg-color-text-dim)',
                margin: '0 0 2px 0'
              }}
            >
              Forms
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 var(--pg-space-xs) 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              {doc.forms.map((form, i) => (
                <li
                  key={i}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--pg-space-sm)' }}
                >
                  <code style={codeStyle}>{form.notation}</code>
                  <span style={{ color: 'var(--pg-color-text-dim)' }}>{form.note}</span>
                </li>
              ))}
            </ul>

            {doc.comparisons !== undefined && doc.comparisons.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--pg-font-mono)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--pg-color-text-dim)',
                    margin: 'var(--pg-space-xs) 0 2px 0'
                  }}
                >
                  Operators
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 var(--pg-space-xs) 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  {doc.comparisons.map((c, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 'var(--pg-space-sm)'
                      }}
                    >
                      <code style={codeStyle}>{c.operator}</code>
                      <span style={{ color: 'var(--pg-color-text-dim)' }}>{c.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--pg-font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pg-color-text-dim)',
                margin: 'var(--pg-space-xs) 0 2px 0'
              }}
            >
              Examples
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              {doc.examples.map((ex, i) => (
                <li
                  key={i}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--pg-space-sm)' }}
                >
                  <code style={codeStyle}>{ex.notation}</code>
                  <span style={{ color: 'var(--pg-color-text-dim)' }}>{ex.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Builder */}
          <div
            style={{
              padding: 'var(--pg-space-sm) var(--pg-space-md) var(--pg-space-md)',
              borderTop: '1px solid var(--pg-color-border)',
              backgroundColor: 'var(--pg-color-surface-alt)'
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--pg-font-mono)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pg-color-text-dim)',
                marginBottom: 'var(--pg-space-xs)'
              }}
            >
              Add to notation
            </div>
            {builder.kind === 'dice' && (
              <DiceBuilder accentColor={accentColor} onAdd={handleAdd} disabled={false} />
            )}
            {builder.kind === 'number' && (
              <NumberBuilder
                builder={builder}
                accentColor={accentColor}
                onAdd={handleAdd}
                disabled={!canAdd}
              />
            )}
            {builder.kind === 'condition' && (
              <ConditionBuilder
                builder={builder}
                accentColor={accentColor}
                onAdd={handleAdd}
                disabled={!canAdd}
              />
            )}
            {builder.kind === 'no-arg' && (
              <NoArgBuilder
                fragment={builder.fragment}
                accentColor={accentColor}
                onAdd={handleAdd}
                disabled={!canAdd}
              />
            )}
            {!canAdd && doc.category !== 'Core' && doc.category !== 'Special' && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--pg-color-text-dim)',
                  marginTop: 'var(--pg-space-xs)',
                  fontStyle: 'italic'
                }}
              >
                Enter a dice expression first
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ---- Main component ----

export function QuickReferenceGrid({
  notation,
  selectedEntry,
  onSelect,
  onAdd
}: QuickReferenceGridProps): React.ReactElement {
  const theme = useTheme()

  const grouped = useMemo(() => {
    const groups = groupByCategory()
    const ordered: { category: ModifierCategory; docs: readonly NotationDoc[]; color: string }[] =
      []
    for (const cat of CATEGORY_ORDER) {
      const docs = groups.get(cat)
      if (docs !== undefined && docs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sampleColor = theme === 'light' ? docs[0]!.colorLight : docs[0]!.color
        ordered.push({ category: cat, docs, color: sampleColor })
      }
    }
    return ordered
  }, [theme])

  const selectedDoc = selectedEntry !== null ? (NOTATION_DOCS[selectedEntry] ?? null) : null
  const selectedAccent =
    selectedDoc !== null ? (theme === 'light' ? selectedDoc.colorLight : selectedDoc.color) : ''

  const midpoint = Math.ceil(grouped.length / 2)
  const leftGroups = grouped.slice(0, midpoint)
  const rightGroups = grouped.slice(midpoint)

  return (
    <div style={{ position: 'relative', fontFamily: 'var(--pg-font-body)' }}>
      <style>{RESPONSIVE_STYLES}</style>
      <div className="qrg-masonry">
        <div className="qrg-col">
          {leftGroups.map(({ category, docs, color }) => (
            <Section key={category} label={CATEGORY_LABELS[category]} color={color}>
              {docs.map(doc => (
                <EntryRow
                  key={doc.key}
                  doc={doc}
                  isSelected={selectedEntry === doc.key}
                  onSelect={onSelect}
                  theme={theme}
                />
              ))}
            </Section>
          ))}
        </div>

        <div className="qrg-col">
          {rightGroups.map(({ category, docs, color }) => (
            <Section key={category} label={CATEGORY_LABELS[category]} color={color}>
              {docs.map(doc => (
                <EntryRow
                  key={doc.key}
                  doc={doc}
                  isSelected={selectedEntry === doc.key}
                  onSelect={onSelect}
                  theme={theme}
                />
              ))}
            </Section>
          ))}
        </div>
      </div>

      {selectedDoc !== null && (
        <DocModal
          doc={selectedDoc}
          accentColor={selectedAccent}
          notation={notation}
          onClose={() => {
            onSelect(selectedDoc.key)
          }}
          onAdd={onAdd}
        />
      )}
    </div>
  )
}
