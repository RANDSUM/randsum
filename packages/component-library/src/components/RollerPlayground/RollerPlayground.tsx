import { useCallback, useEffect, useRef, useState } from 'react'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import type { RollRecord } from '@randsum/roller'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; record: RollRecord }

function openInStackBlitz(notation: string): void {
  const code = `import { roll } from '@randsum/roller'

const result = roll('${notation}')

console.log('Notation:', '${notation}')
console.log('Total:   ', result.total)
console.log('Rolls:   ', result.rolls)
`
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://stackblitz.com/run'
  form.target = '_blank'

  const packageJson = JSON.stringify(
    {
      name: 'randsum-playground',
      version: '1.0.0',
      private: true,
      scripts: { start: 'tsx index.ts' },
      dependencies: { '@randsum/roller': 'latest', tsx: 'latest' }
    },
    null,
    2
  )

  const fields: Record<string, string> = {
    'project[title]': `RANDSUM — ${notation}`,
    'project[description]': `Rolling ${notation} with @randsum/roller`,
    'project[template]': 'node',
    'project[files][index.ts]': code,
    'project[files][package.json]': packageJson
  }

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export function RollerPlayground({
  stackblitz = true,
  defaultNotation = '4d6L',
  className
}: {
  readonly stackblitz?: boolean
  readonly defaultNotation?: string
  readonly className?: string
} = {}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const isValid = notation.length > 0 && isDiceNotation(notation)
  const shellVariant = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setState({ status: 'rolling' })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const result = roll(notation)
      if (result.error || !result.rolls[0]) return
      setState({ status: 'result', total: result.total, record: result.rolls[0] })
    }, 300)
  }, [notation, isValid])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
  }, [])

  const rootClass = ['roller-playground', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className={`roller-playground-shell roller-playground-shell--${shellVariant}`}>
        <div className="roller-playground-row">
          <button
            className="roller-playground-btn"
            onClick={handleRoll}
            disabled={!isValid || state.status === 'rolling'}
            aria-label={state.status === 'rolling' ? 'Rolling' : 'Roll'}
          >
            {state.status === 'rolling' ? (
              <span className="roller-playground-spinner" aria-hidden="true" />
            ) : (
              'Roll'
            )}
          </button>
          <div className="roller-playground-input-wrap">
            <input
              type="text"
              className="roller-playground-input"
              value={notation}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRoll()
              }}
              placeholder="4d6L"
              spellCheck={false}
              autoComplete="off"
              aria-label="Dice notation"
            />
          </div>

          <div
            className={[
              'roller-playground-chip',
              state.status !== 'result' ? 'roller-playground-chip--empty' : ''
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {state.status === 'result' && (
              <span className="roller-playground-chip-value">{state.total}</span>
            )}
          </div>
        </div>
        <div className="roller-playground-desc-row">
          <span
            className={`roller-playground-desc--${notation.length === 0 ? 'hint' : isValid ? 'valid' : 'invalid'}`}
          >
            {notationDesc(notation, isValid)}
          </span>
          {stackblitz && (
            <button
              className="roller-playground-stackblitz"
              onClick={() => {
                openInStackBlitz(notation)
              }}
              aria-label="Edit in StackBlitz"
            >
              <svg
                className="roller-playground-stackblitz-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M10 0L0 14h10L5 24 24 8h-10L19 0z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function notationDesc(notation: string, isValid: boolean): string {
  if (notation.length === 0) return 'Try: 4d6L, 1d20+5, 2d8!'
  if (!isValid) return 'Invalid notation'
  const result = validateNotation(notation)
  if (!result.valid) return notation
  const lines = result.description.flat()
  return lines.length > 0 ? lines.join(', ') : notation
}
