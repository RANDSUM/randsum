import { describe, expect, test } from 'bun:test'
import { createRollOptions } from '../support/fixtures'
import { optionsToDescription } from '../../src/lib/transformers'

describe(optionsToDescription, () => {
  test('generates description for basic numeric options', () => {
    const options = createRollOptions()
    const description = optionsToDescription(options)
    expect(description).toContain('Roll 1 20-sided die')
  })

  test('generates description for multiple dice', () => {
    const options = createRollOptions({ sides: 6, quantity: 3 })
    const description = optionsToDescription(options)
    expect(description).toContain('Roll 3 6-sided dice')
  })

  test('includes modifier descriptions', () => {
    const options = createRollOptions({
      quantity: 2,
      modifiers: { drop: { lowest: 1 } }
    })
    const description = optionsToDescription(options)
    expect(description.length).toBeGreaterThan(1)
    expect(description[0]).toContain('Roll 2 20-sided dice')
    expect(description).toContainEqual(expect.stringContaining('Drop lowest'))
  })
})
