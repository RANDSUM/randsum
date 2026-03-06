import { useCallback, useEffect, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { roll } from '@randsum/roller'
import type { RollArgument } from '@randsum/roller'
import { findDroppedIndices, findLastCommentIndex } from './formatLiveResult'
import type { DiceSegment } from './formatLiveResult'
import './RollableCode.css'

interface RollableCodeProps {
  readonly code: string
  readonly lang?: string
  readonly liveArgs: readonly (string | number | Record<string, unknown>)[]
  readonly children?: never
}

interface RollState {
  readonly segments: readonly DiceSegment[]
  readonly total: number
}

function computeRollState(result: ReturnType<typeof roll>): RollState | null {
  if (result.error) return null

  const record = result.rolls[0]
  const initial = record.modifierHistory.initialRolls
  const modified = record.modifierHistory.modifiedRolls
  const dropped = findDroppedIndices(initial, modified)

  const segments: DiceSegment[] = initial.map((value, i) => ({
    value,
    dropped: dropped.has(i)
  }))

  return { segments, total: result.total }
}

/**
 * Interactive code block with live dice rolling.
 * Must be used with `client:only="react"` in MDX — React hooks are incompatible with client:load SSR.
 */
export function RollableCode({
  code,
  lang = 'typescript',
  liveArgs
}: RollableCodeProps): React.JSX.Element {
  const [rollState, setRollState] = useState<RollState | null>(null)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const check = (): void => {
      setIsDark(document.documentElement.dataset.theme !== 'light')
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => {
      observer.disconnect()
    }
  }, [])

  const highlightStyle = isDark ? atomOneDark : atomOneLight

  const lines = code.split('\n')
  const commentLineIndex = findLastCommentIndex(lines)

  // Always split at the comment line for a consistent two-section layout
  const beforeLines = commentLineIndex !== -1 ? lines.slice(0, commentLineIndex) : lines
  const commentLine = commentLineIndex !== -1 ? (lines[commentLineIndex] ?? '') : ''
  const commentStart = commentLine.lastIndexOf('//')
  const beforeComment = commentStart !== -1 ? commentLine.slice(0, commentStart) : commentLine
  const beforeCode = [...beforeLines, beforeComment].join('\n').trimEnd()

  const execute = useCallback(() => {
    const result = roll(...(liveArgs as RollArgument[]))
    setRollState(computeRollState(result))
  }, [liveArgs])

  const clear = useCallback(() => {
    setRollState(null)
  }, [])

  return (
    <div className="rollable-code">
      <div className="rollable-code-header">
        <div className="rollable-traffic-lights">
          <span className="rollable-dot rollable-dot-red" />
          <span className="rollable-dot rollable-dot-yellow" />
          <span className="rollable-dot rollable-dot-green" />
        </div>
        <div className="rollable-code-controls">
          {rollState === null ? (
            <button type="button" className="rollable-btn rollable-btn-run" onClick={execute}>
              ▶ Run
            </button>
          ) : (
            <>
              <button type="button" className="rollable-btn rollable-btn-reroll" onClick={execute}>
                ↻ Re-roll
              </button>
              <button type="button" className="rollable-btn rollable-btn-clear" onClick={clear}>
                ✕ Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rollable-code-body">
        <SyntaxHighlighter
          language={lang}
          style={highlightStyle}
          customStyle={{
            margin: 0,
            padding: '0.75rem 1.5rem 0',
            background: 'transparent',
            fontSize: '0.9rem',
            lineHeight: 1.7
          }}
          codeTagProps={{ style: { fontFamily: 'inherit' } }}
        >
          {beforeCode}
        </SyntaxHighlighter>
        <ResultPane rollState={rollState} />
      </div>
    </div>
  )
}

function ResultPane({ rollState }: { readonly rollState: RollState | null }): React.JSX.Element {
  if (rollState === null) {
    return (
      <div className="rollable-live-comment rollable-live-comment-empty">
        <span className="rollable-comment-prefix">// ...</span>
      </div>
    )
  }

  return (
    <div className="rollable-live-comment">
      <span className="rollable-comment-prefix">// [</span>
      {rollState.segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <span className="rollable-comment-sep">, </span>}
          {seg.dropped ? (
            <del className="rollable-dice-dropped">{seg.value}</del>
          ) : (
            <span className="rollable-dice-kept">{seg.value}</span>
          )}
        </span>
      ))}
      <span className="rollable-comment-prefix">] = {rollState.total}</span>
    </div>
  )
}
