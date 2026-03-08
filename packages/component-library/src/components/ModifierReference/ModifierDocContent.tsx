import type React from 'react'
import type { ModifierReferenceCell } from './ModifierReference'
import { MODIFIER_DOCS } from './modifierDocs'
import './ModifierDocContent.css'

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
  onBack
}: {
  readonly cell: ModifierReferenceCell
  readonly onBack?: () => void
}): React.JSX.Element {
  const doc = MODIFIER_DOCS[cell.notation]

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
        {onBack && (
          <button className="modifier-doc-back" onClick={onBack} type="button">
            ← back
          </button>
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

      {doc.comparisons && (
        <>
          <div className="modifier-doc-section-label">Comparisons</div>
          <div className="modifier-doc-comparisons">
            {doc.comparisons.map(cmp => (
              <span
                key={cmp.operator}
                className="modifier-doc-comparison-chip"
                data-tooltip={cmp.note}
              >
                {cmp.operator}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="modifier-doc-section-label">Examples</div>
      <div className="modifier-doc-examples">
        {doc.examples.map(ex => (
          <div key={ex.notation} className="modifier-doc-example-row">
            <span className="modifier-doc-example-notation">{ex.notation}</span>
            <span className="modifier-doc-example-desc">{ex.description}</span>
          </div>
        ))}
      </div>

      {onBack && (
        <button className="modifier-doc-back" onClick={onBack} type="button">
          ← back
        </button>
      )}
    </div>
  )
}
