import React from 'react'
import type { Token } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import './TokenOverlayInput.css'

export interface TokenOverlayInputProps {
  readonly tokens: readonly Token[]
  readonly hoveredTokenIdx: number | null
  readonly theme?: 'light' | 'dark'
  readonly children: React.ReactNode
  readonly overlayRef?: React.Ref<HTMLDivElement>
}

function tokenColor(
  doc: { readonly color: string; readonly colorLight: string } | undefined,
  theme: 'light' | 'dark'
): string | undefined {
  if (!doc) return undefined
  return theme === 'light' ? doc.colorLight : doc.color
}

export function TokenOverlayInput({
  tokens,
  hoveredTokenIdx,
  theme = 'dark',
  children,
  overlayRef
}: TokenOverlayInputProps): React.JSX.Element {
  return (
    <div className="du-input-wrap">
      {tokens.length > 0 && (
        <div className="du-notation-overlay" aria-hidden="true" ref={overlayRef}>
          {tokens.map((token, i) => {
            const doc = NOTATION_DOCS[token.key]
            const color = tokenColor(doc, theme)
            const isHovered = hoveredTokenIdx === i
            const isDimmed = hoveredTokenIdx !== null && !isHovered
            const className = [
              'du-token',
              `du-token--${token.category}`,
              !doc ? 'du-token--unknown' : '',
              isDimmed ? 'du-token--dim' : '',
              isHovered ? 'du-token--active' : ''
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <span
                key={i}
                className={className}
                style={color !== undefined ? { color } : undefined}
              >
                {token.text}
              </span>
            )
          })}
        </div>
      )}
      {children}
    </div>
  )
}
