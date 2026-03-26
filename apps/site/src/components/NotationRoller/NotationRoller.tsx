import { useState } from 'react'
import { NotationRoller as DuNotationRoller, RollResultPanel } from '@randsum/dice-ui'
import type { RollResult } from '@randsum/dice-ui'
import { buildStackBlitzProject } from '../../helpers/stackblitz'
import { ErrorBoundary } from '../ErrorBoundary'
import './NotationRoller.css'

// Re-export RollResultDisplay for tests
export { RollResultDisplay as RollResult } from '@randsum/dice-ui'

function SiteActions(notation: string): React.JSX.Element {
  return (
    <div className="nr-code-actions">
      <a
        className={`nr-code-action-btn${notation.length === 0 ? ' nr-code-action-btn--disabled' : ''}`}
        href={
          notation.length > 0
            ? `https://randsum.io?notation=${encodeURIComponent(notation)}`
            : undefined
        }
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Playground"
        aria-label="Open this notation in the RANDSUM Playground"
        aria-disabled={notation.length === 0}
        onClick={
          notation.length === 0
            ? e => {
                e.preventDefault()
              }
            : undefined
        }
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
      <button
        className="nr-code-action-btn"
        title="Edit in StackBlitz"
        aria-label="Open and edit this notation in StackBlitz"
        disabled={notation.length === 0}
        onClick={() => {
          const project = buildStackBlitzProject(notation)
          const params = new URLSearchParams({
            title: project.title,
            description: project.description,
            template: project.template
          })
          for (const [name, content] of Object.entries(project.files)) {
            params.set(`file[${name}]`, content)
          }
          window.open(
            `https://stackblitz.com/run?${params.toString()}`,
            '_blank',
            'noopener,noreferrer'
          )
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  )
}

export function NotationRoller(props: {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly className?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
}): React.JSX.Element {
  const [result, setResult] = useState<RollResult | null>(null)

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative' }}>
        <DuNotationRoller
          {...props}
          className={['not-content', props.className].filter(Boolean).join(' ')}
          renderActions={SiteActions}
          onRoll={setResult}
        />
        {result !== null && (
          <>
            <div
              className="du-notation-roller-result-backdrop"
              onClick={() => {
                setResult(null)
              }}
            />
            <div className="du-notation-roller-result-overlay">
              <RollResultPanel
                total={result.total}
                records={result.records}
                notation={result.notation}
                onClose={() => {
                  setResult(null)
                }}
              />
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
