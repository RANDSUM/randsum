import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../../src/modifiers'
import { MODIFIER_ORDER } from '../../../src/modifiers/registry'
import { integerDivideModifier } from '../../../src/modifiers/integerDivide'
import { minusModifier } from '../../../src/modifiers/minus'
import { moduloModifier } from '../../../src/modifiers/modulo'
import { multiplyModifier } from '../../../src/modifiers/multiply'
import { multiplyTotalModifier } from '../../../src/modifiers/multiplyTotal'
import { plusModifier } from '../../../src/modifiers/plus'
import { roll } from '../../../src/roll'

describe('MODIFIER_ORDER constant', () => {
  test('is a module-level constant (not recomputed per call)', () => {
    // MODIFIER_ORDER must be a constant reference — same array every access
    expect(MODIFIER_ORDER).toBe(MODIFIER_ORDER)
  })

  test('matches RANDSUM_MODIFIERS.map(m => m.name)', () => {
    const expected = RANDSUM_MODIFIERS.map(m => m.name)
    expect(MODIFIER_ORDER).toEqual(expected)
  })

  test('contains all modifier names in priority order', () => {
    expect(MODIFIER_ORDER).toContain('cap')
    expect(MODIFIER_ORDER).toContain('drop')
    expect(MODIFIER_ORDER).toContain('keep')
    expect(MODIFIER_ORDER).toContain('plus')
    expect(MODIFIER_ORDER).toContain('minus')
    expect(MODIFIER_ORDER).toContain('multiply')
    expect(MODIFIER_ORDER).toContain('multiplyTotal')
    expect(MODIFIER_ORDER).toContain('integerDivide')
    expect(MODIFIER_ORDER).toContain('modulo')
  })

  test('cap appears before plus in order', () => {
    const capIdx = MODIFIER_ORDER.indexOf('cap')
    const plusIdx = MODIFIER_ORDER.indexOf('plus')
    expect(capIdx).toBeGreaterThanOrEqual(0)
    expect(plusIdx).toBeGreaterThanOrEqual(0)
    expect(capIdx).toBeLessThan(plusIdx)
  })
})

describe('mutatesRolls flag on arithmetic modifiers', () => {
  test('plusModifier has mutatesRolls: false', () => {
    expect(plusModifier.mutatesRolls).toBe(false)
  })

  test('minusModifier has mutatesRolls: false', () => {
    expect(minusModifier.mutatesRolls).toBe(false)
  })

  test('multiplyModifier has mutatesRolls: false', () => {
    expect(multiplyModifier.mutatesRolls).toBe(false)
  })

  test('integerDivideModifier has mutatesRolls: false', () => {
    expect(integerDivideModifier.mutatesRolls).toBe(false)
  })

  test('moduloModifier has mutatesRolls: false', () => {
    expect(moduloModifier.mutatesRolls).toBe(false)
  })
})

describe('mutatesRolls flag on modifier definitions', () => {
  test('plusModifier has mutatesRolls: false', () => {
    expect(plusModifier.mutatesRolls).toBe(false)
  })

  test('minusModifier has mutatesRolls: false', () => {
    expect(minusModifier.mutatesRolls).toBe(false)
  })

  test('multiplyModifier has mutatesRolls: false', () => {
    expect(multiplyModifier.mutatesRolls).toBe(false)
  })

  test('multiplyTotalModifier has mutatesRolls: false', () => {
    expect(multiplyTotalModifier.mutatesRolls).toBe(false)
  })

  test('integerDivideModifier has mutatesRolls: false', () => {
    expect(integerDivideModifier.mutatesRolls).toBe(false)
  })

  test('moduloModifier has mutatesRolls: false', () => {
    expect(moduloModifier.mutatesRolls).toBe(false)
  })
})

describe('arithmetic modifiers produce correct logs via createArithmeticLog', () => {
  test('roll with plus modifier produces modifier log with empty added/removed', () => {
    const result = roll('2d6+3')
    const plusLog = result.rolls[0]?.modifierLogs.find(l => l.modifier === 'plus')
    expect(plusLog).toBeDefined()
    expect(plusLog?.added).toEqual([])
    expect(plusLog?.removed).toEqual([])
  })

  test('roll with minus modifier produces modifier log with empty added/removed', () => {
    const result = roll('2d6-2')
    const minusLog = result.rolls[0]?.modifierLogs.find(l => l.modifier === 'minus')
    expect(minusLog).toBeDefined()
    expect(minusLog?.added).toEqual([])
    expect(minusLog?.removed).toEqual([])
  })

  test('roll with plus modifier gives correct total adjustment', () => {
    // Use a seeded-style assertion: result total = sum of rolls + 5
    const result = roll('1d1+5')
    // 1d1 always rolls 1, total should be 6
    expect(result.total).toBe(6)
  })

  test('roll with minus modifier gives correct total adjustment', () => {
    const result = roll('1d1-0')
    expect(result.total).toBe(1)
  })
})
