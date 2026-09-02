import { describe, expect, test } from 'bun:test'
import { helpCommand } from '../../src/commands/help.js'
import { commands } from '../../src/commands/index.js'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { BRAND } from '../../src/utils/palette.js'

const view = helpCommand.buildView!(makeContext([]))
const text = textOf(view)

describe('helpCommand', () => {
  test('lists commands from the barrel, excluding help itself', () => {
    for (const command of commands) {
      if (command.data.name === 'help') continue
      expect(text).toContain(`/${command.data.name}`)
    }
    expect(text).not.toContain('**/help')
  })

  test('names each required option, so the list is usable without guessing', () => {
    // The embed version could tell you `/pbta` existed but not that it needs a
    // stat — nine full-width fields of names and descriptions, no usage.
    expect(text).toContain('**/pbta <stat>**')
    expect(text).toContain('**/roll <notation>**')
  })

  test('a command with no required options is listed without a hint', () => {
    expect(text).toContain('**/fate**')
  })

  test('points at the two ways in: /roll and /notation', () => {
    expect(text).toContain('`/roll`')
    expect(text).toContain('`/notation`')
  })

  test('carries the brand accent and the attribution', () => {
    expect(accentsOf(view)[0]).toBe(BRAND)
    expect(text).toContain('rolled with 👹 by randsum.dev')
  })
})
