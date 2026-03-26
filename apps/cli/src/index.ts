#!/usr/bin/env node
import { render } from 'ink'
import { createElement } from 'react'
import { NotationRoller } from '@randsum/dice-ui/ink'
import { runSimple } from './simple/run'
import { version as VERSION } from '../package.json'

const HELP = `Usage: randsum [notation...] [flags]

Roll dice using RANDSUM notation.

Arguments:
  notation          Dice notation (e.g. 4d6L, 2d20+5)

Flags:
  -v, --verbose     Show detailed roll breakdown
  --json            Output as JSON
  -r, --repeat N    Roll N times
  -s, --seed N      Use seeded random
  -h, --help        Show this help
  -V, --version     Show version

Examples:
  randsum 4d6L             Roll 4d6, drop lowest
  randsum 2d20L +5         Roll with advantage + modifier
  randsum 1d20 -v          Verbose output
  randsum 3d6 --json       JSON output
  randsum 4d6L -r 6        Roll 6 times`

interface ParsedArgs {
  readonly notations: string[]
  readonly verbose: boolean
  readonly json: boolean
  readonly repeat: number
  readonly seed: number | undefined
  readonly help: boolean
  readonly version: boolean
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const notations: string[] = []
  const flags = {
    verbose: false,
    json: false,
    repeat: 1,
    seed: undefined as number | undefined,
    help: false,
    version: false
  }

  const args = argv.slice(2)
  for (const [i, arg] of args.entries()) {
    if (arg === '-v' || arg === '--verbose') {
      flags.verbose = true
    } else if (arg === '--json') {
      flags.json = true
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
    } else {
      notations.push(arg)
    }
  }

  return { notations, ...flags }
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

  if (parsed.notations.length === 0) {
    render(createElement(NotationRoller))
    return
  }

  // Simple mode
  const output = runSimple({
    notations: parsed.notations,
    verbose: parsed.verbose,
    json: parsed.json,
    repeat: parsed.repeat,
    seed: parsed.seed
  })
  // eslint-disable-next-line no-console
  console.log(output)
}

main(process.argv)
