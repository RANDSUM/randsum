#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { runRolls } from './run'
import { version as VERSION } from '../package.json'

const HELP = `Usage: randsum <notation...> [flags]

Roll dice using RANDSUM notation.

Arguments:
  notation          Dice notation (e.g. 4d6L, 2d20+5)

Flags:
  -v, --verbose     Show detailed roll breakdown
  --json            Output as JSON (with -r: JSON-lines, one object per line)
  -t, --total       Print only the numeric total (one per line, for scripting)
  -r, --repeat N    Roll N times
  -s, --seed N      Use seeded random
  -h, --help        Show this help
  -V, --version     Show version

Examples:
  randsum 4d6L             Roll 4d6, drop lowest
  randsum 2d20L +5         Roll with advantage + modifier
  randsum 1d20 -v          Verbose output
  randsum 3d6 --json       JSON output
  randsum 4d6L -r 6        Roll 6 times
  randsum 3d6 -t           Print only the total`

interface ParsedArgs {
  readonly notations: string[]
  readonly verbose: boolean
  readonly json: boolean
  readonly total: boolean
  readonly repeat: number
  readonly seed: number | undefined
  readonly help: boolean
  readonly version: boolean
  readonly error: string | undefined
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const notations: string[] = []
  const flags = {
    verbose: false,
    json: false,
    total: false,
    repeat: 1,
    seed: undefined as number | undefined,
    help: false,
    version: false,
    error: undefined as string | undefined
  }

  const args = argv.slice(2)
  for (const [i, arg] of args.entries()) {
    if (arg === '-v' || arg === '--verbose') {
      flags.verbose = true
    } else if (arg === '--json') {
      flags.json = true
    } else if (arg === '-t' || arg === '--total') {
      flags.total = true
    } else if (arg === '-r' || arg === '--repeat') {
      flags.repeat = Number(args[i + 1]) || 1
    } else if (arg === '-s' || arg === '--seed') {
      const seedValue = Number(args[i + 1])
      flags.seed = Number.isNaN(seedValue) ? undefined : seedValue
    } else if (arg === '-h' || arg === '--help') {
      flags.help = true
    } else if (arg === '-V' || arg === '--version') {
      flags.version = true
    } else if (
      !Number.isNaN(Number(arg)) &&
      i > 0 &&
      (args[i - 1] === '-r' ||
        args[i - 1] === '--repeat' ||
        args[i - 1] === '-s' ||
        args[i - 1] === '--seed')
    ) {
      // Skip — already consumed as flag value
    } else if (arg.startsWith('-') && !/^-\d/.test(arg)) {
      // Looks like a flag but is not recognized. Negative numbers (`-5`) are
      // excluded so they still flow to notation validation rather than being
      // mislabeled as flags.
      flags.error =
        flags.error ?? `Unknown flag: ${arg}\n\nRun 'randsum --help' to see available flags.`
    } else {
      notations.push(arg)
    }
  }

  if (flags.total && flags.json) {
    flags.error = flags.error ?? 'Cannot combine --total with --json. Use one or the other.'
  }

  return { notations, ...flags }
}

function readStdinSync(): string {
  try {
    return readFileSync(0, 'utf8').trim()
  } catch {
    return ''
  }
}

export function main(argv: readonly string[]): void {
  const parsed = parseArgs(argv)

  if (parsed.help) {
    // eslint-disable-next-line no-console
    console.log(HELP)
    return
  }

  if (parsed.version) {
    // eslint-disable-next-line no-console
    console.log(VERSION)
    return
  }

  if (parsed.error) {
    console.error(parsed.error)
    process.exit(1)
  }

  const stdinNotations =
    parsed.notations.length === 0 && !process.stdin.isTTY
      ? readStdinSync().split(/\s+/).filter(Boolean)
      : []
  const notations = parsed.notations.length > 0 ? parsed.notations : stdinNotations

  if (notations.length === 0) {
    // eslint-disable-next-line no-console
    console.log(HELP)
    process.exit(1)
  }

  const result = runRolls({
    notations,
    verbose: parsed.verbose,
    json: parsed.json,
    total: parsed.total,
    repeat: parsed.repeat,
    seed: parsed.seed
  })

  if (result.stdout) {
    // eslint-disable-next-line no-console
    console.log(result.stdout)
  }
  if (result.stderr) {
    console.error(result.stderr)
  }
  if (result.hadError) {
    process.exit(1)
  }
}

if (import.meta.main) {
  main(process.argv)
}
