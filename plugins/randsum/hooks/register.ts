import type { Register } from 'claude-code'

import { roll } from './roller.generated.js'

/**
 * The randsum plugin's mod: `/roll <notation>` rolls with the real RANDSUM
 * engine on the person's machine, with no model turn. The result prints at
 * once, pins as the plugin's status line, and reaches Claude as a hidden note,
 * so a player rolls their own dice and Claude reacts to the number instead of
 * rolling for them. Interpreting a roll for a game stays with the skills and
 * the MCP server.
 */

const DEFAULT_NOTATION = '1d20'

/** Uniform in [0, 1) from the sandbox's CSPRNG rather than Math.random. */
const randomFn = (): number => (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 2 ** 32

/**
 * `/roll` arguments as roll() arguments: `1d20 + 5, 2d6` is `['1d20+5', '2d6']`.
 * Spaces around an operator join its sides; other spaces and commas separate rolls.
 */
export function parseArgs(args: string): readonly string[] {
  const parts = args
    .replace(/\s*([+\-*/%])\s*/g, '$1')
    .split(/[\s,]+/)
    .filter(part => part.length > 0)
  return parts.length > 0 ? parts : [DEFAULT_NOTATION]
}

const list = (values: readonly unknown[]): string => values.join(', ')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'roll',
      description: 'Roll dice yourself with RANDSUM, e.g. /roll 4d6L or /roll 1d20+5',
      argumentHint: '[notation]'
    })
    return next(e)
  })

  on('command.run', { command: 'roll' }, ($, e) => {
    // `args` is "" when nothing was typed, but a plugin's $.command.run can leave it out.
    const notations = parseArgs(e.args ?? '')
    const asked = notations.join(' ')
    try {
      const result = roll(...notations, { randomFn })
      const groups = result.rolls.map(record => {
        const dropped = record.initialRolls.length !== record.rolls.length
        const kept = `[${list(record.rolls)}]`
        return dropped
          ? `${record.notation} ${kept} from [${list(record.initialRolls)}]`
          : `${record.notation} ${kept}`
      })
      const line = `${asked} → ${result.total}`
      $.ui.status(`Last roll: ${line}`)
      return {
        text: `${line}\n${groups.join('\n')}`,
        context: [
          `The user rolled ${asked} themselves with the RANDSUM /roll command: total ${result.total}; ${groups.join('; ')}. This is their roll, made outside the conversation with a real random number generator. Use this result as rolled and do not reroll it.`
        ]
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      return {
        text: `Could not roll ${asked}: ${reason}\nNotation reference: https://notation.randsum.dev/`
      }
    }
  })
}
