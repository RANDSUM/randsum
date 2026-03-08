import type React from 'react'
import type { ModifierReferenceCell } from './ModifierReference'
import { MODIFIER_DOCS } from './modifierDocs'
import './ModifierDocContent.css'

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
            <span className="modifier-doc-notation-base">{cell.notation}</span>
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
          <span className="modifier-doc-notation-base">{doc.displayBase}</span>
          {doc.displayOptional && (
            <span className="modifier-doc-notation-optional">{doc.displayOptional}</span>
          )}
        </div>
        <div className="modifier-doc-header-text">
          <div className="modifier-doc-title">{doc.title}</div>
          <p className="modifier-doc-description">{doc.description}</p>
        </div>
      </div>

      <div className="modifier-doc-section-label">Forms</div>
      <div className="modifier-doc-forms">
        {doc.forms.map(form => (
          <div key={form.notation} className="modifier-doc-form-row">
            <span className="modifier-doc-form-notation">{form.notation}</span>
            <span className="modifier-doc-form-note">{form.note}</span>
          </div>
        ))}
      </div>

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
