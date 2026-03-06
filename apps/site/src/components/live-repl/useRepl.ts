// apps/site/src/components/live-repl/useRepl.ts
import { useCallback, useState } from 'react'
import { transform } from 'sucrase'

export interface ReplOutput {
  readonly logs: readonly string[]
  readonly result: string | null
  readonly error: string | null
}

export type ReplStatus = 'idle' | 'running' | 'success' | 'error'

export interface ReplState {
  readonly status: ReplStatus
  readonly output: ReplOutput | null
}

export interface UseReplReturn {
  readonly state: ReplState
  readonly run: (code: string) => void
  readonly clear: () => void
}

function compileTypeScript(code: string): { compiled: string } | { error: string } {
  try {
    const compiled = transform(code, {
      transforms: ['typescript'],
      filePath: 'repl.ts'
    }).code
    return { compiled }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export function useRepl(): UseReplReturn {
  const [state, setState] = useState<ReplState>({ status: 'idle', output: null })

  const run = useCallback((code: string) => {
    setState({ status: 'running', output: null })

    // Compile TypeScript → JS (strips type annotations, preserves ES module syntax)
    const compileResult = compileTypeScript(code)
    if ('error' in compileResult) {
      setState({
        status: 'error',
        output: { logs: [], result: null, error: compileResult.error }
      })
      return
    }

    // Create a new worker per run — termination is how we enforce 5s timeout
    const worker = new Worker(new URL('./repl-worker.ts', import.meta.url), { type: 'module' })

    const timeoutId = setTimeout(() => {
      worker.terminate()
      setState({
        status: 'error',
        output: { logs: [], result: null, error: 'Execution timed out (5s)' }
      })
    }, 5000)

    worker.onmessage = (event: MessageEvent<ReplOutput>) => {
      clearTimeout(timeoutId)
      worker.terminate()
      setState({
        status: event.data.error ? 'error' : 'success',
        output: event.data
      })
    }

    worker.onerror = (err: ErrorEvent) => {
      clearTimeout(timeoutId)
      worker.terminate()
      setState({
        status: 'error',
        output: { logs: [], result: null, error: err.message }
      })
    }

    worker.postMessage(compileResult.compiled)
  }, [])

  const clear = useCallback(() => {
    setState({ status: 'idle', output: null })
  }, [])

  return { state, run, clear }
}
