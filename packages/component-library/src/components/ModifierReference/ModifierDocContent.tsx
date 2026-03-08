import { useState } from 'react'
import type React from 'react'
import { isDiceNotation } from '@randsum/roller'
import type { ModifierReferenceCell } from './ModifierReference'
import { MODIFIER_DOCS } from './modifierDocs'
import './ModifierDocContent.css'

function ChipLabel({ text }: { readonly text: string }): React.JSX.Element {
  const parts = (text.match(/[><=]+|[^><=]+/g) ?? []).map(segment => ({
    segment,
    isOp: '><='.includes(segment[0] ?? '')
  }))
  return (
    <>
      {parts.map((part, idx) =>
        part.isOp ? (
          <span key={idx}>{part.segment}</span>
        ) : (
          <span key={idx} className="modifier-doc-chip-var">
            {part.segment}
          </span>
        )
      )}
    </>
  )
}

function NotationBase({ text }: { readonly text: string }): React.JSX.Element {
  const dotIdx = text.indexOf('..')
  if (dotIdx === -1) {
    return <span className="modifier-doc-notation-base">{text}</span>
  }
  return (
    <span className="modifier-doc-notation-base">
      {text.slice(0, dotIdx)}
      <span className="modifier-doc-notation-optional">{'..'}</span>
      {text.slice(dotIdx + 2)}
    </span>
  )
}

type InputKind = 'core' | 'none' | 'optional-num' | 'required-num' | 'brace' | 'optional-brace'

function getInputKind(notation: string): InputKind {
  if (notation === 'xDN') return 'core'
  if (notation === '!') return 'none'
  if (['L', 'H', 'K', 'kl', '!!', '!p'].includes(notation)) return 'optional-num'
  if (['+', '\u2013', '*', '**'].includes(notation)) return 'required-num'
  if (['R{..}', 'C{..}', 'D{..}', 'V{..}', 'S{..}'].includes(notation)) return 'brace'
  if (notation === 'U') return 'optional-brace'
  return 'none'
}

function getInsertBase(notation: string): string {
  if (notation === '\u2013') return '-'
  const braceIdx = notation.indexOf('{')
  if (braceIdx !== -1) return notation.slice(0, braceIdx)
  return notation
}

function buildInsert(
  kind: InputKind,
  notation: string,
  inputValue: string,
  quantity: string,
  sides: string,
  notationHasCore: boolean
): string {
  if (kind === 'core') return notationHasCore ? `+${quantity}d${sides}` : `${quantity}d${sides}`
  const base = getInsertBase(notation)
  if (kind === 'none') return base
  if (kind === 'optional-num' || kind === 'required-num') return `${base}${inputValue}`
  if (kind === 'brace') return `${base}{${inputValue}}`
  return inputValue ? `${base}{${inputValue}}` : base
}

function checkIsValid(kind: InputKind, insert: string): boolean {
  if (kind === 'none') return true
  if (kind === 'required-num' && !/\d/.test(insert)) return false
  if (kind === 'brace' && !/\{.+\}/.test(insert)) return false
  if (kind === 'core') {
    const coreStr = insert.startsWith('+') ? insert.slice(1) : insert
    return isDiceNotation(coreStr)
  }
  return isDiceNotation(`4d6${insert}`)
}

function extractExampleValue(
  exNotation: string,
  cellNotation: string
): { readonly quantity?: string; readonly sides?: string; readonly value?: string } {
  if (cellNotation === 'xDN') {
    const m = /^(\d+)[Dd](\d+)/.exec(exNotation)
    return m ? { quantity: m[1] ?? '', sides: m[2] ?? '' } : {}
  }
  const stripped = exNotation.replace(/^\d+[Dd]\d+/, '')
  if (cellNotation === 'L') return { value: /[Ll](\d*)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === 'H') return { value: /[Hh](\d*)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === 'K') {
    const noKl = stripped.replace(/[Kk][Ll]\d*/g, '')
    return { value: /[Kk](\d*)/.exec(noKl)?.[1] ?? '' }
  }
  if (cellNotation === 'kl') return { value: /[Kk][Ll](\d*)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === '!!') return { value: /!!(\d*)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === '!p') return { value: /!p(\d*)/i.exec(stripped)?.[1] ?? '' }
  if (cellNotation === '+') return { value: /\+(\d+)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === '\u2013') return { value: /-(\d+)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === '*') {
    const noDouble = stripped.replace(/\*\*\d*/g, '')
    return { value: /\*(\d+)/.exec(noDouble)?.[1] ?? '' }
  }
  if (cellNotation === '**') return { value: /\*\*(\d+)/.exec(stripped)?.[1] ?? '' }
  if (cellNotation === 'U') return { value: /[Uu](?:\{([^}]*)\})?/.exec(stripped)?.[1] ?? '' }
  return { value: /\{([^}]*)\}/.exec(stripped)?.[1] ?? '' }
}

function iw(value: string, placeholder: string): string {
  return `${Math.max(1, value.length || placeholder.length)}ch`
}

export function ModifierDocContent({
  cell,
  onBack,
  onAdd,
  notationHasCore = false
}: {
  readonly cell: ModifierReferenceCell
  readonly onBack?: () => void
  readonly onAdd?: (notation: string) => void
  readonly notationHasCore?: boolean
}): React.JSX.Element {
  const doc = MODIFIER_DOCS[cell.notation]
  const kind = getInputKind(cell.notation)

  const [inputValue, setInputValue] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [sidesInput, setSidesInput] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const insertString = buildInsert(
    kind,
    cell.notation,
    inputValue,
    quantityInput,
    sidesInput,
    notationHasCore
  )
  const isValid = checkIsValid(kind, insertString)
  const showAdd = onAdd !== undefined
  const hasFooter = Boolean(onBack) || showAdd

  const handleExampleClick = (exNotation: string): void => {
    const extracted = extractExampleValue(exNotation, cell.notation)
    if (extracted.quantity !== undefined) setQuantityInput(extracted.quantity)
    if (extracted.sides !== undefined) setSidesInput(extracted.sides)
    if (extracted.value !== undefined) setInputValue(extracted.value)
    setIsDirty(true)
  }

  const boxClass = [
    'modifier-doc-notation-box',
    isDirty && !isValid ? 'modifier-doc-notation-box--invalid' : ''
  ]
    .filter(Boolean)
    .join(' ')

  const renderNotationBox = (): React.JSX.Element => {
    if (kind === 'core') {
      return (
        <div className={boxClass}>
          <input
            className="modifier-doc-notation-input"
            value={quantityInput}
            placeholder="x"
            onChange={e => {
              setQuantityInput(e.target.value)
              setIsDirty(true)
            }}
            style={{ width: iw(quantityInput, 'x') }}
            type="text"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="modifier-doc-notation-base">D</span>
          <input
            className="modifier-doc-notation-input"
            value={sidesInput}
            placeholder="N"
            onChange={e => {
              setSidesInput(e.target.value)
              setIsDirty(true)
            }}
            style={{ width: iw(sidesInput, 'N') }}
            type="text"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )
    }

    if (kind === 'none') {
      return (
        <div className={boxClass}>
          <NotationBase text={doc?.displayBase ?? cell.notation} />
        </div>
      )
    }

    if (kind === 'optional-num' || kind === 'required-num') {
      const displayBase = doc?.displayBase ?? getInsertBase(cell.notation)
      const placeholder = doc?.displayOptional ?? 'n'
      return (
        <div className={boxClass}>
          <span className="modifier-doc-notation-base">{displayBase}</span>
          <input
            className={[
              'modifier-doc-notation-input',
              kind === 'optional-num' ? 'modifier-doc-notation-input--muted' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            value={inputValue}
            placeholder={placeholder}
            onChange={e => {
              setInputValue(e.target.value)
              setIsDirty(true)
            }}
            style={{ width: iw(inputValue, placeholder) }}
            type="text"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )
    }

    if (kind === 'brace') {
      const displayBase = doc?.displayBase ?? cell.notation
      const braceIdx = displayBase.indexOf('{')
      const prefix = braceIdx !== -1 ? displayBase.slice(0, braceIdx) : getInsertBase(cell.notation)
      return (
        <div className={boxClass}>
          <span className="modifier-doc-notation-base">{prefix}</span>
          <span className="modifier-doc-notation-base">{'{'}</span>
          <input
            className="modifier-doc-notation-input"
            value={inputValue}
            placeholder=".."
            onChange={e => {
              setInputValue(e.target.value)
              setIsDirty(true)
            }}
            style={{ width: iw(inputValue, '..') }}
            type="text"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="modifier-doc-notation-base">{'}'}</span>
        </div>
      )
    }

    // optional-brace (U)
    return (
      <div className={boxClass}>
        <span className="modifier-doc-notation-base">U</span>
        <span className="modifier-doc-notation-optional">{'{'}</span>
        <input
          className="modifier-doc-notation-input modifier-doc-notation-input--muted"
          value={inputValue}
          placeholder=".."
          onChange={e => {
            setInputValue(e.target.value)
            setIsDirty(true)
          }}
          style={{ width: iw(inputValue, '..') }}
          type="text"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="modifier-doc-notation-optional">{'}'}</span>
      </div>
    )
  }

  if (!doc) {
    const insertable = cell.notation === '\u2013' ? '-' : cell.notation.replace('..', '')
    return (
      <div className="modifier-doc">
        <div className="modifier-doc-top">
          <div className="modifier-doc-notation-box">
            <NotationBase text={cell.notation} />
          </div>
          <div className="modifier-doc-header-text">
            <div className="modifier-doc-title">{cell.description}</div>
          </div>
        </div>
        {hasFooter && (
          <div className="modifier-doc-footer">
            {onBack && (
              <button className="modifier-doc-back" onClick={onBack} type="button">
                ← back
              </button>
            )}
            {showAdd && (
              <button
                className="modifier-doc-add"
                onClick={() => {
                  onAdd(insertable)
                }}
                type="button"
              >
                Add <span className="modifier-doc-add-key">{insertable}</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="modifier-doc">
      <div className="modifier-doc-top">
        {renderNotationBox()}
        <div className="modifier-doc-header-text">
          <div className="modifier-doc-title">{doc.title}</div>
          <p className="modifier-doc-description">{doc.description}</p>
        </div>
      </div>

      <div className="modifier-doc-body">
        {doc.comparisons && (
          <div className="modifier-doc-body-comparisons">
            <div className="modifier-doc-section-label">Comparisons</div>
            <div className="modifier-doc-comparisons">
              {doc.comparisons.map(cmp => (
                <span
                  key={cmp.operator}
                  className="modifier-doc-comparison-chip"
                  data-tooltip={cmp.note}
                >
                  <ChipLabel text={cmp.operator} />
                </span>
              ))}
            </div>
          </div>
        )}
        <div
          className={
            doc.comparisons ? 'modifier-doc-body-examples' : 'modifier-doc-body-examples--full'
          }
        >
          <div className="modifier-doc-section-label">Examples</div>
          <div className="modifier-doc-examples">
            {doc.examples.map(ex => (
              <div
                key={ex.notation}
                className={[
                  'modifier-doc-example-row',
                  showAdd ? 'modifier-doc-example-row--clickable' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={
                  showAdd
                    ? () => {
                        handleExampleClick(ex.notation)
                      }
                    : undefined
                }
                role={showAdd ? 'button' : undefined}
                tabIndex={showAdd ? 0 : undefined}
                onKeyDown={
                  showAdd
                    ? e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleExampleClick(ex.notation)
                        }
                      }
                    : undefined
                }
              >
                <span className="modifier-doc-example-notation">{ex.notation}</span>
                <span className="modifier-doc-example-desc">{ex.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasFooter && (
        <div className="modifier-doc-footer">
          {onBack && (
            <button className="modifier-doc-back" onClick={onBack} type="button">
              ← back
            </button>
          )}
          {showAdd && (
            <button
              className="modifier-doc-add"
              onClick={() => {
                onAdd(insertString)
              }}
              disabled={!isValid}
              type="button"
            >
              Add <span className="modifier-doc-add-key">{insertString}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
