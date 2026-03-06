// apps/site/src/components/live-repl/LiveRepl.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type Monaco from 'monaco-editor'
import { useRepl } from './useRepl'
import type { ReplState } from './useRepl'
import './LiveRepl.css'

interface LiveReplProps {
  readonly code: string
  readonly lang?: string
}

export function LiveRepl({
  code: initialCode,
  lang = 'typescript'
}: LiveReplProps): React.JSX.Element {
  const [code, setCode] = useState(initialCode)
  const [isDark, setIsDark] = useState(true)
  const [editorHeight, setEditorHeight] = useState(120)
  const runRef = useRef<((code: string) => void) | null>(null)
  const codeRef = useRef(code)
  const { state, run, clear } = useRepl()

  // Keep refs in sync so Monaco's onMount closure sees latest values
  useEffect(() => {
    runRef.current = run
  }, [run])
  useEffect(() => {
    codeRef.current = code
  }, [code])

  // Track Starlight dark/light theme
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

  const handleMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) => {
      // Auto-resize to content
      const updateHeight = (): void => {
        const height = ed.getContentHeight()
        setEditorHeight(height)
        ed.layout()
      }
      updateHeight()
      ed.onDidContentSizeChange(updateHeight)

      // Cmd+Enter / Ctrl+Enter to run
      ed.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
        runRef.current?.(codeRef.current)
      })
    },
    []
  )

  const handleRun = useCallback(() => {
    run(code)
  }, [code, run])

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code)
  }, [code])

  const isRunning = state.status === 'running'
  const hasResult = state.status === 'success' || state.status === 'error'

  return (
    <div className="live-repl">
      <div className="live-repl-editor" style={{ height: editorHeight }}>
        <div className="live-repl-buttons">
          <button type="button" className="live-repl-btn live-repl-btn-copy" onClick={handleCopy}>
            Copy
          </button>
          {!hasResult ? (
            <button
              type="button"
              className="live-repl-btn live-repl-btn-run"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? '...' : '▶ Run'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="live-repl-btn live-repl-btn-run"
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? '...' : '↻ Re-run'}
              </button>
              <button type="button" className="live-repl-btn live-repl-btn-clear" onClick={clear}>
                ✕ Clear
              </button>
            </>
          )}
        </div>
        <Editor
          height={editorHeight}
          language={lang}
          value={code}
          onChange={v => {
            setCode(v ?? '')
          }}
          theme={isDark ? 'vs-dark' : 'vs'}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'off',
            folding: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>
      <OutputPane state={state} />
    </div>
  )
}

function OutputPane({ state }: { readonly state: ReplState }): React.JSX.Element {
  if (state.status === 'idle' || state.status === 'running') {
    return (
      <div className="live-repl-output live-repl-output-empty">
        <span className="live-repl-output-prefix">
          {state.status === 'running' ? '// running...' : '// waiting...'}
        </span>
      </div>
    )
  }

  const { output } = state
  if (!output) return <div className="live-repl-output live-repl-output-empty" />

  if (output.error) {
    return (
      <div className="live-repl-output">
        <span className="live-repl-output-error">✕ {output.error}</span>
      </div>
    )
  }

  return (
    <div className="live-repl-output">
      {output.logs.map((log, i) => (
        <div key={i} className="live-repl-output-log">
          <span className="live-repl-output-prefix">&gt; </span>
          {log}
        </div>
      ))}
      {output.result !== null && (
        <div className="live-repl-output-result">
          <span className="live-repl-output-prefix">= </span>
          {output.result}
        </div>
      )}
    </div>
  )
}
