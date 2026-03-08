import type React from 'react'
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

export function ModifierDocContent({
  cell,
  onBack,
  onAdd
}: {
  readonly cell: ModifierReferenceCell
  readonly onBack?: () => void
  readonly onAdd?: () => void
}): React.JSX.Element {
  const doc = MODIFIER_DOCS[cell.notation]
  const insertable = cell.notation === '\u2013' ? '-' : cell.notation.replace('..', '')
  const showAdd = !cell.isCore && onAdd !== undefined
  const hasFooter = Boolean(onBack) || showAdd

  if (!doc) {
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
              <button className="modifier-doc-add" onClick={onAdd} type="button">
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
        <div className="modifier-doc-notation-box">
          <NotationBase text={doc.displayBase} />
          {doc.displayOptional && (
            <span className="modifier-doc-notation-optional">{doc.displayOptional}</span>
          )}
        </div>
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
              <div key={ex.notation} className="modifier-doc-example-row">
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
            <button className="modifier-doc-add" onClick={onAdd} type="button">
              Add <span className="modifier-doc-add-key">{insertable}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
