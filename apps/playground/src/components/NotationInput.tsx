import React, { forwardRef, useCallback } from 'react'
import type { Token } from '@randsum/roller/tokenize'
import type { ValidationState } from './PlaygroundApp'
import { validationStateToBorderColor } from './notationInputUtils'
import './NotationInput.css'

export { tokenTypeToClass, validationStateToBorderColor } from './notationInputUtils'

interface NotationInputProps {
  readonly value: string
  readonly validationState: ValidationState
  readonly tokens: readonly Token[]
  readonly hoveredTokenIdx: number | null
  readonly onHoverToken: (idx: number | null) => void
  readonly onChange: (notation: string) => void
  readonly onSubmit: () => void
  readonly readOnly: boolean
  readonly onFork: () => void
  readonly onShare: () => void
  readonly shareCopied: boolean
  readonly sessionId: string | null
}

export const NotationInput = forwardRef<HTMLInputElement, NotationInputProps>(
  (
    {
      value,
      validationState,
      tokens,
      hoveredTokenIdx,
      onHoverToken,
      onChange,
      onSubmit,
      readOnly,
      onFork,
      onShare,
      shareCopied,
      sessionId
    },
    ref
  ): React.ReactElement => {
    const borderColor = validationStateToBorderColor(validationState)
    const isValid = validationState === 'valid'
    const inputRef = ref as React.RefObject<HTMLInputElement> | null

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLInputElement>) => {
        if (tokens.length === 0 || value.length === 0) return
        const input = inputRef?.current
        if (!input) return
        const rect = input.getBoundingClientRect()
        const chWidth = input.offsetWidth / value.length
        const charIdx = Math.floor((e.clientX - rect.left) / chWidth)
        const tokenIdx = tokens.findIndex(t => charIdx >= t.start && charIdx < t.end)
        onHoverToken(tokenIdx === -1 ? null : tokenIdx)
      },
      [tokens, value.length, inputRef, onHoverToken]
    )

    const handleMouseLeave = useCallback(() => {
      onHoverToken(null)
    }, [onHoverToken])

    return (
      <div
        className={`notation-input-frame${readOnly ? ' notation-input-frame--readonly' : ''}`}
        style={{ borderColor }}
      >
        <span className="notation-input-prefix">
          <span className="notation-input-fn">roll</span>
          <span className="notation-input-paren">(</span>
          <span className="notation-input-quote">&#39;</span>
        </span>

        <div className="notation-input-wrap">
          {tokens.length > 0 && (
            <div className="notation-input-overlay" aria-hidden="true">
              {tokens.map((token, i) => (
                <span
                  key={i}
                  className={[
                    `pg-token pg-token--${token.type}`,
                    hoveredTokenIdx !== null && hoveredTokenIdx !== i ? 'pg-token--dim' : '',
                    hoveredTokenIdx === i ? 'pg-token--active' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {token.text}
                </span>
              ))}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            className={`notation-input-field${tokens.length > 0 ? ' notation-input-field--highlighted' : ''}${readOnly ? ' notation-input-field--readonly' : ''}`}
            style={{ width: `${Math.max(value.length, 4)}ch` }}
            autoFocus={!readOnly}
            value={value}
            placeholder="4d6L"
            disabled={readOnly}
            onChange={e => {
              onChange(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && isValid) {
                onSubmit()
              }
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            spellCheck={false}
            autoComplete="off"
            aria-label="Dice notation"
            aria-readonly={readOnly}
          />
        </div>

        <span className="notation-input-suffix">
          <span className="notation-input-quote">&#39;</span>
          <span className="notation-input-paren">)</span>
        </span>

        {sessionId !== null && (
          <button
            type="button"
            className={`notation-input-share${shareCopied ? ' notation-input-share--copied' : ''}`}
            onClick={onShare}
            aria-label="Copy share link"
          >
            {shareCopied ? 'Copied!' : 'Share'}
          </button>
        )}

        {readOnly ? (
          <button
            type="button"
            className="notation-input-go notation-input-go--fork"
            onClick={onFork}
          >
            Fork
          </button>
        ) : (
          <button
            type="submit"
            className={`notation-input-go${isValid ? ' notation-input-go--active' : ''}`}
            disabled={!isValid}
            onClick={onSubmit}
          >
            Roll
          </button>
        )}
      </div>
    )
  }
)
