#!/usr/bin/env node
/**
 * rdn-conformance: run the RDN conformance vectors against any implementation.
 *
 *   rdn-conformance [--vectors <file>] [--level <n>] [--json] [--timeout <ms>] -- <adapter command...>
 *
 * The adapter is a process in any language. The runner writes one JSON request per
 * line to its stdin and reads one JSON response per line from its stdout (see the
 * README's "Adapter protocol"). Exit code 0 when the requested level (or, without
 * --level, Level 1) is reached, 1 when it is not, 2 on a usage error.
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { LEVELS } from './levels'
import { type AdapterResponse, type Evaluate, formatReport, runConformance } from './runner'
import type { ConformanceFile } from './types'
import bundled from '../vectors/v0.9.0.json' with { type: 'json' }

interface Options {
  readonly vectors?: string
  readonly level: number
  readonly json: boolean
  readonly timeout: number
  readonly command: readonly string[]
}

const USAGE = `Usage: rdn-conformance [--vectors <file>] [--level <1-4>] [--json] [--timeout <ms>] -- <adapter command...>

Runs the RANDSUM Dice Notation conformance vectors against an adapter process.
The adapter reads one JSON request per line on stdin and writes one JSON response
per line on stdout. See https://github.com/RANDSUM/notation-spec#adapter-protocol`

function usage(message: string): never {
  process.stderr.write(`${message}\n\n${USAGE}\n`)
  process.exit(2)
}

function parseArgs(argv: readonly string[]): Options {
  const split = argv.indexOf('--')
  const flags = split === -1 ? argv : argv.slice(0, split)
  const command = split === -1 ? [] : argv.slice(split + 1)
  const value = (name: string): string | undefined => {
    const i = flags.indexOf(name)
    if (i === -1) return undefined
    const next = flags[i + 1]
    if (next === undefined || next.startsWith('--')) usage(`${name} needs a value`)
    return next
  }
  if (flags.includes('--help') || flags.includes('-h')) {
    process.stdout.write(`${USAGE}\n`)
    process.exit(0)
  }
  const level = Number(value('--level') ?? '1')
  if (!LEVELS.some(l => l.level === level)) usage('--level must be 1, 2, 3 or 4')
  const timeout = Number(value('--timeout') ?? '5000')
  if (!Number.isFinite(timeout) || timeout <= 0) usage('--timeout must be a positive number')
  if (command.length === 0) usage('Give the adapter command after --')
  const vectors = value('--vectors')
  return {
    ...(vectors === undefined ? {} : { vectors }),
    level,
    json: flags.includes('--json'),
    timeout,
    command
  }
}

/** Spawn the adapter and evaluate requests over its stdio, one line each way. */
function adapterProcess(
  command: readonly string[],
  timeout: number
): { readonly evaluate: Evaluate; readonly close: () => void } {
  const [bin, ...args] = command
  if (bin === undefined) usage('Give the adapter command after --')
  const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'inherit'] })
  const lines = createInterface({ input: child.stdout })
  const waiting: ((line: string | Error) => void)[] = []
  const buffered: string[] = []
  const exited: { error?: Error } = {}

  const deliver = (line: string | Error): void => {
    const next = waiting.shift()
    if (next !== undefined) next(line)
    else if (typeof line === 'string') buffered.push(line)
  }
  lines.on('line', line => {
    if (line.trim() !== '') deliver(line)
  })
  const fail = (error: Error): void => {
    exited.error = error
    for (const next of waiting.splice(0)) next(error)
  }
  child.on('error', error => fail(new Error(`could not start the adapter: ${error.message}`)))
  child.on('exit', code => fail(new Error(`the adapter exited (code ${String(code)})`)))

  const nextLine = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const ready = buffered.shift()
      if (ready !== undefined) return resolve(ready)
      if (exited.error !== undefined) return reject(exited.error)
      const timer = setTimeout(() => {
        const i = waiting.indexOf(receive)
        if (i !== -1) waiting.splice(i, 1)
        reject(new Error(`no response within ${timeout}ms`))
      }, timeout)
      const receive = (line: string | Error): void => {
        clearTimeout(timer)
        if (typeof line === 'string') resolve(line)
        else reject(line)
      }
      waiting.push(receive)
    })

  const evaluate: Evaluate = async request => {
    if (exited.error !== undefined) throw exited.error
    child.stdin.write(`${JSON.stringify(request)}\n`)
    const line = await nextLine()
    const parsed: unknown = JSON.parse(line)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`expected a JSON object, got ${line}`)
    }
    const response = parsed as AdapterResponse
    if (response.id !== undefined && response.id !== request.id) {
      throw new Error(`answered vector ${response.id} when asked for ${request.id}`)
    }
    return response
  }

  return {
    evaluate,
    close: () => {
      child.removeAllListeners('exit')
      child.stdin.end()
      setTimeout(() => child.kill(), 1000).unref()
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const file = (
    options.vectors === undefined ? bundled : JSON.parse(readFileSync(options.vectors, 'utf8'))
  ) as ConformanceFile
  const adapter = adapterProcess(options.command, options.timeout)
  const report = await runConformance(file, adapter.evaluate).finally(adapter.close)
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatReport(report))
  process.exitCode = report.highestLevel >= options.level ? 0 : 1
}

await main()
