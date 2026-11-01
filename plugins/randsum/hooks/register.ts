import type { Register } from 'claude-code'

import { roll } from './roller.generated.js'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'roll', description: 'Roll dice', argumentHint: '[notation]' })
    return next(e)
  })

  on('command.run', { command: 'roll' }, (_, e) => ({
    text: String(roll(e.args && e.args.length > 0 ? e.args : '1d20').total)
  }))
}
