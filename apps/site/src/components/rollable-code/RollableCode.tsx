import { useCallback, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
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
  readonly commentLineIndex: number
}

function computeRollState(
  result: ReturnType<typeof roll>,
  commentLineIndex: number
): RollState | null {
  if (result.error) return null

  if (result.rolls.length === 0) return null
  const record = result.rolls[0]
  const initial = record.modifierHistory.initialRolls
  const modified = record.modifierHistory.modifiedRolls
  const dropped = findDroppedIndices(initial, modified)

  const segments: DiceSegment[] = initial.map((value, i) => ({
    value,
    dropped: dropped.has(i)
  }))

  return { segments, total: result.total, commentLineIndex }
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

  const lines = code.split('\n')
  const commentLineIndex = findLastCommentIndex(lines)

  const execute = useCallback(() => {
    const result = roll(...(liveArgs as RollArgument[]))
    setRollState(computeRollState(result, commentLineIndex))
  }, [liveArgs, commentLineIndex])

  const clear = useCallback(() => {
    setRollState(null)
  }, [])

  return (
    <div className="rollable-code">
      <div className="rollable-code-header">
        <span className="rollable-code-lang">{lang}</span>
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
        {rollState !== null && commentLineIndex !== -1 ? (
          <LiveCodeView
            lines={lines}
            commentLineIndex={commentLineIndex}
            rollState={rollState}
            lang={lang}
          />
        ) : (
          <SyntaxHighlighter
            language={lang}
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: '1.25rem 1.5rem',
              background: 'transparent',
              fontSize: '0.9rem',
              lineHeight: 1.7
            }}
            codeTagProps={{ style: { fontFamily: 'inherit' } }}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  )
}

interface LiveCodeViewProps {
  readonly lines: readonly string[]
  readonly commentLineIndex: number
  readonly rollState: RollState
  readonly lang: string
}

function LiveCodeView({
  lines,
  commentLineIndex,
  rollState,
  lang
}: LiveCodeViewProps): React.JSX.Element {
  const beforeLines = lines.slice(0, commentLineIndex)
  const commentLine = lines[commentLineIndex] ?? ''
  const commentStart = commentLine.lastIndexOf('//')
  const beforeComment = commentLine.slice(0, commentStart)

  const beforeCode = [...beforeLines, beforeComment].join('\n')

  return (
    <>
      <SyntaxHighlighter
        language={lang}
        style={atomOneDark}
        customStyle={{
          margin: 0,
          padding: '1.25rem 1.5rem 0',
          background: 'transparent',
          fontSize: '0.9rem',
          lineHeight: 1.7
        }}
        codeTagProps={{ style: { fontFamily: 'inherit' } }}
      >
        {beforeCode}
      </SyntaxHighlighter>
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
    </>
  )
}
