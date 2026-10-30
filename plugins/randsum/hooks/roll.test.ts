import { describe, expect, test } from 'claude-code/testing'

import { parseArgs } from './register'

describe('/roll', () => {
  test('registers the command at session start', async ($, on) => {
    const registered: string[] = []
    on('command.register', (_, e) => {
      registered.push(e.name)
      return { value: { command: e.name } }
    })
    on('session.start', (_, e) => ({ cwd: e.cwd }))

    await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

    expect(registered).toEqual(['roll'])
  })

  test('rolls, pins the status line and tells Claude the result', async ($, on) => {
    const statuses: (string | undefined)[] = []
    on('ui.status', (_, e) => {
      statuses.push(e.text)
      return { value: undefined }
    })

    const ran = await $.command.run({ command: 'roll', args: '4d6L' })

    expect(ran.text).toMatch(/^4d6L → \d+\n4d6L \[\d, \d, \d\] from \[\d, \d, \d, \d\]$/)
    expect(statuses[0]).toMatch(/^Last roll: 4d6L → \d+$/)
    expect(ran.context?.[0]).toContain('The user rolled 4d6L themselves')
  })

  test('the total stays within the dice', async $ => {
    for (const _ of Array.from({ length: 200 })) {
      const ran = await $.command.run({ command: 'roll', args: '2d6+3' })
      const total = Number(ran.text?.match(/→ (-?\d+)/)?.[1])
      expect(total).toBeGreaterThanOrEqual(5)
      expect(total).toBeLessThanOrEqual(15)
    }
  })

  test('with no notation it rolls a d20', async $ => {
    const ran = await $.command.run({ command: 'roll' })

    expect(ran.text).toMatch(/^1d20 → \d+/)
  })

  test('bad notation explains itself and tells Claude nothing', async $ => {
    const ran = await $.command.run({ command: 'roll', args: '4q7' })

    expect(ran.text).toContain('Could not roll 4q7')
    expect(ran.context).toBeUndefined()
  })
})

describe('parseArgs', () => {
  test('joins an operator to its sides and splits separate rolls', async () => {
    expect(parseArgs('1d20 + 5, 2d6')).toEqual(['1d20+5', '2d6'])
    expect(parseArgs('4d6 // 2')).toEqual(['4d6//2'])
    expect(parseArgs('  ')).toEqual(['1d20'])
  })
})
