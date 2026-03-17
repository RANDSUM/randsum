import React, { useMemo } from 'react'
import { tokenize } from '@randsum/roller/tokenize'
import type { ValidationState } from './PlaygroundApp'
import { tokenTypeToClass, validationStateToBorderColor } from './notationInputUtils'
import './NotationInput.css'

export { tokenTypeToClass, validationStateToBorderColor } from './notationInputUtils'

export function NotationInput({
  value,
  validationState,
  onChange,
  onSubmit
}: {
  readonly value: string
  readonly validationState: ValidationState
  readonly onChange: (notation: string) => void
  readonly onSubmit: () => void
}): React.ReactElement {
  const tokens = useMemo(() => tokenize(value), [value])
  const borderColor = validationStateToBorderColor(validationState)
  const isValid = validationState === 'valid'

  return (
    <div className="notation-input-frame" style={{ borderColor }}>
      <span className="notation-input-prefix">
        <span className="notation-input-fn">roll</span>
        <span className="notation-input-paren">(</span>
        <span className="notation-input-quote">&#39;</span>
      </span>

      <div className="notation-input-wrap">
        {tokens.length > 0 && (
          <div className="notation-input-overlay" aria-hidden="true">
            {tokens.map((token, i) => (
              <span key={i} className={tokenTypeToClass(token.type)}>
                {token.text}
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          className={`notation-input-field${tokens.length > 0 ? ' notation-input-field--highlighted' : ''}`}
          autoFocus
          value={value}
          placeholder="4d6L"
          onChange={e => {
            onChange(e.target.value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && isValid) {
              onSubmit()
            }
          }}
          spellCheck={false}
          autoComplete="off"
          aria-label="Dice notation"
        />
      </div>

      <span className="notation-input-suffix">
        <span className="notation-input-quote">&#39;</span>
        <span className="notation-input-paren">)</span>
      </span>

      <button
        type="submit"
        className={`notation-input-go${isValid ? ' notation-input-go--active' : ''}`}
        disabled={!isValid}
        onClick={onSubmit}
      >
        Go
      </button>
    </div>
  )
}
