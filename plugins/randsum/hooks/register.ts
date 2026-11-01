import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'roll', description: 'Roll dice', argumentHint: '[notation]' })
    return next(e)
  })

  on('command.run', { command: 'roll' }, () => ({ text: 'stub' }))
}
