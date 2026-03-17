import React, { Fragment } from 'react'
import type { ValidationResult } from '@randsum/roller'
import type { Token } from '@randsum/roller/tokenize'
import './NotationInput.css'

interface NotationDescriptionProps {
  readonly validationResult: ValidationResult | null
  readonly tokens: readonly Token[]
  readonly hoveredTokenIdx: number | null
  readonly onHoverToken: (idx: number | null) => void
}

const containerStyle: React.CSSProperties = {
  minHeight: '1.5rem',
  margin: 0,
  fontFamily: 'var(--pg-font-body)',
  fontSize: '0.875rem',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.15rem'
}

export function NotationDescription({
  validationResult,
  tokens,
  hoveredTokenIdx,
  onHoverToken
}: NotationDescriptionProps): React.ReactElement {
  if (validationResult === null) {
    return <div aria-hidden="true" style={{ minHeight: '1.5rem' }} />
  }

  if (!validationResult.valid) {
    return (
      <p
        role="alert"
        style={{
          ...containerStyle,
          color: 'var(--pg-color-error)'
        }}
      >
        {validationResult.error.message}
      </p>
    )
  }

  const descriptiveTokens = tokens
    .map((token, tokenIdx) => ({ token, tokenIdx }))
    .filter(({ token }) => Boolean(token.description))

  return (
    <p style={containerStyle}>
      {descriptiveTokens.map(({ token, tokenIdx }, i) => {
        const sep =
          i === 0
            ? null
            : token.type === 'core'
              ? token.text.startsWith('-')
                ? ' \u2212 '
                : ' + '
              : ', '

        return (
          <Fragment key={tokenIdx}>
            {sep !== null && <span style={{ opacity: 0.5, userSelect: 'none' }}>{sep}</span>}
            <span
              className={[
                `pg-desc-chip pg-desc-chip--${token.type}`,
                hoveredTokenIdx === tokenIdx ? 'pg-desc-chip--active' : '',
                hoveredTokenIdx !== null && hoveredTokenIdx !== tokenIdx ? 'pg-desc-chip--dim' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => {
                onHoverToken(tokenIdx)
              }}
              onMouseLeave={() => {
                onHoverToken(null)
              }}
            >
              {token.description}
            </span>
          </Fragment>
        )
      })}
    </p>
  )
}
