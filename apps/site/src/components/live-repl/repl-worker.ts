// apps/site/src/components/live-repl/repl-worker.ts
import { roll } from '@randsum/roller'

interface WorkerResult {
  readonly logs: readonly string[]
  readonly result: string | null
  readonly error: string | null
}

const serialize = (value: unknown): string => {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

self.onmessage = (event: MessageEvent<string>) => {
  const code = event.data
  const logs: string[] = []

  const capturedConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map(a => serialize(a)).join(' '))
    }
  }

  try {
    // Strip import statements since roll is pre-injected into scope
    const executableCode = code
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n')

    // Execute with pre-injected deps in isolated function scope
    // eslint-disable-next-line no-new-func
    const fn = Function('roll', 'console', `"use strict";\n${executableCode}`)
    const lastValue: unknown = fn(roll, capturedConsole)

    const result: WorkerResult = {
      logs,
      result: lastValue !== undefined ? serialize(lastValue) : null,
      error: null
    }
    self.postMessage(result)
  } catch (err) {
    const result: WorkerResult = {
      logs,
      result: null,
      error: err instanceof Error ? err.message : String(err)
    }
    self.postMessage(result)
  }
}
