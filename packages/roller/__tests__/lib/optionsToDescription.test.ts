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
  })
})

describe('greaterThanOrEqual descriptions', () => {
  test('drop modifier includes greaterThanOrEqual description', () => {
    const descriptions = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { greaterThanOrEqual: 5 } }
    })
    const allText = descriptions.join(' ')
    expect(allText).toMatch(/greater than or equal to 5/i)
  })

  test('reroll modifier includes greaterThanOrEqual description', () => {
    const descriptions = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { reroll: { greaterThanOrEqual: 4 } }
    })
    const allText = descriptions.join(' ')
    expect(allText).toMatch(/greater than or equal to 4/i)
  })
})
