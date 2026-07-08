import type { RollArgument, RollConfig, RollerRollResult } from '@randsum/roller'
import { suggestNotationFix } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { createSeededRandom } from '@randsum/roller/random'
import { isDiceNotation } from '@randsum/roller/validate'
import { formatCompact, formatJson, formatVerbose } from './format'

interface RunOptions {
  readonly notations: readonly string[]
  readonly verbose: boolean
  readonly json: boolean
  readonly total?: boolean
  readonly repeat: number
  readonly seed?: number | undefined
}

export interface RunResult {
  readonly stdout: string
  readonly stderr: string
  readonly hadError: boolean
}

export function runRolls(options: RunOptions): RunResult {
  const config: RollConfig | undefined =
    options.seed !== undefined ? { randomFn: createSeededRandom(options.seed) } : undefined

  const format = options.total
    ? (result: RollerRollResult): string => String(result.total)
    : options.json
      ? formatJson
      : options.verbose
        ? formatVerbose
        : formatCompact

  const stdoutLines: string[] = []
  const stderrLines: string[] = []

  const notations = options.notations as readonly RollArgument[]

  for (const _i of Array.from({ length: options.repeat })) {
    try {
      const result = config ? roll(...notations, config) : roll(...notations)
      stdoutLines.push(format(result))
    } catch (e) {
      const baseMessage = `Error: ${e instanceof Error ? e.message : String(e)}`
      const invalidNotation = options.notations.find(notation => !isDiceNotation(notation))
      const suggestion = invalidNotation ? suggestNotationFix(invalidNotation) : undefined
      stderrLines.push(
        suggestion ? `${baseMessage}\n\nDid you mean \`${suggestion}\`?` : baseMessage
      )
    }
  }

  return {
    stdout: stdoutLines.join('\n'),
    stderr: stderrLines.join('\n'),
    hadError: stderrLines.length > 0
  }
}
