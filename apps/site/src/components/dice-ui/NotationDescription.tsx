import { Fragment, useMemo } from 'react'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { tokenize } from '@randsum/roller/tokenize'
import type { Token } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { useTheme } from './useTheme'
import { tokenColor } from './tokenColor'
import './NotationRoller.css'

export type NotationCheck =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid'; readonly message: string }
  | { readonly kind: 'valid' }

/**
 * Parsing is not enough: `1d20L` parses but cannot roll (it drops the only
 * die). A trial roll catches what only the modifiers know, so the input can
 * say why before the Roll button would fail silently.
 */
export function checkNotation(notation: string): NotationCheck {
  if (notation.length === 0) return { kind: 'empty' }
  if (!isDiceNotation(notation)) return { kind: 'invalid', message: 'Invalid notation' }
  try {
    roll(notation)
    return { kind: 'valid' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Drop the error class's 'Modifier error for "drop": ' preamble
    return { kind: 'invalid', message: message.replace(/^[^:]*: /, '') }
  }
}

export interface NotationDescriptionProps {
  readonly notation: string
  readonly className?: string
  readonly tokens?: readonly Token[]
  readonly check?: NotationCheck
  readonly hoveredTokenIdx?: number | null
  readonly onHoverToken?: (tokenIdx: number | null) => void
  readonly children?: React.ReactNode
}

/** The plain-language reading of a notation, one colored chip per token. */
export function NotationDescription({
  notation,
  className,
  tokens: providedTokens,
  check: providedCheck,
  hoveredTokenIdx = null,
  onHoverToken,
  children
}: NotationDescriptionProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = useMemo(() => providedTokens ?? tokenize(notation), [notation, providedTokens])
  const check = useMemo(() => providedCheck ?? checkNotation(notation), [notation, providedCheck])
  const rootClass = ['du-notation-roller-desc-row', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      {check.kind === 'empty' ? (
        <span className="du-notation-roller-desc du-notation-roller-desc--hint">
          Try: 4d6L, 1d20+5, 2d8!
        </span>
      ) : check.kind === 'invalid' ? (
        <span className="du-notation-roller-desc du-notation-roller-desc--invalid" role="alert">
          {check.message}
        </span>
      ) : (
        <span className="du-notation-roller-desc du-notation-roller-desc--valid">
          {tokens
            .map((token, tokenIdx) => ({ token, tokenIdx }))
            .filter(({ token }) => Boolean(token.description))
            .map(({ token, tokenIdx }, i) => {
              const sep =
                i === 0
                  ? null
                  : token.category === 'Core'
                    ? token.text.startsWith('-')
                      ? ' \u2212 '
                      : ' + '
                    : ', '
              return (
                <Fragment key={tokenIdx}>
                  {sep !== null && (
                    <span
                      className={[
                        'du-nr-desc-sep',
                        hoveredTokenIdx !== null ? 'du-nr-desc-sep--dim' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {sep}
                    </span>
                  )}
                  <span
                    className={[
                      'du-nr-desc-chip',
                      `du-nr-desc-chip--${token.category}`,
                      hoveredTokenIdx === tokenIdx ? 'du-nr-desc-chip--active' : '',
                      hoveredTokenIdx !== null && hoveredTokenIdx !== tokenIdx
                        ? 'du-nr-desc-chip--dim'
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      {
                        '--chip-color': tokenColor(NOTATION_DOCS[token.key], theme)
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => {
                      onHoverToken?.(tokenIdx)
                    }}
                    onMouseLeave={() => {
                      onHoverToken?.(null)
                    }}
                  >
                    {token.description}
                  </span>
                </Fragment>
              )
            })}
        </span>
      )}
      {children}
    </div>
  )
}
