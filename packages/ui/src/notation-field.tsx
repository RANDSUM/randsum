import type React from 'react'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { cx } from './internal/cx'
import type { Roller } from './use-roller'

export type { Roller } from './use-roller'

const MARKS = { empty: '', valid: '✓', invalid: '✕' } as const
const MARK_LABELS = { empty: 'Empty', valid: 'Valid', invalid: 'Invalid' } as const

export function NotationField({
  roller,
  statusId,
  placeholder = '4d6L'
}: {
  readonly roller: Roller
  /** The id of the line that explains the notation, read out with the field. */
  readonly statusId?: string
  readonly placeholder?: string
}): React.JSX.Element {
  const { notation, tokens, check } = roller
  return (
    <div className="rsui-field" data-state={check.kind}>
      <div className="rsui-field-stack">
        {tokens.length > 0 && (
          <div className="rsui-overlay" aria-hidden="true">
            {tokens.map(token => {
              const doc = NOTATION_DOCS[token.key]
              const style =
                doc === undefined
                  ? undefined
                  : ({
                      '--rsui-tok-dark': doc.color,
                      '--rsui-tok-light': doc.colorLight
                    } as React.CSSProperties)
              return (
                <span
                  key={token.start}
                  className={cx(
                    'rsui-tok',
                    doc !== undefined && 'rsui-tok--doc',
                    token.category === 'unknown' && 'rsui-tok--bad'
                  )}
                  style={style}
                >
                  {token.text}
                </span>
              )
            })}
          </div>
        )}
        <input
          className="rsui-input"
          type="text"
          value={notation}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Dice notation"
          aria-invalid={check.kind === 'invalid'}
          aria-describedby={statusId}
          onChange={event => {
            roller.edit(event.target.value)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              roller.roll()
            }
          }}
        />
      </div>
      {check.kind !== 'empty' && (
        <span className="rsui-mark" role="img" aria-label={MARK_LABELS[check.kind]}>
          {MARKS[check.kind]}
        </span>
      )}
    </div>
  )
}
