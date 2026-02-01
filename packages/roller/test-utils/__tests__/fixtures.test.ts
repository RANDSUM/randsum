import { describe, expect, test } from 'bun:test'
import {
  commonNotations,
  commonRollOptions,
  createMockRollOne,
  createNumericRollBonus,
  createRequiredNumericRollParameters,
  createRollOptions,
  createRollParams
} from '../src/fixtures'

describe('commonNotations', () => {
  test('contains expected notation strings', () => {
    expect(commonNotations.advantage).toBe('2d20H')
    expect(commonNotations.disadvantage).toBe('2d20L')
    expect(commonNotations.abilityScore).toBe('4d6L')
    expect(commonNotations.damage).toBe('1d8+3')
    expect(commonNotations.skillCheck).toBe('1d20+5')
    expect(commonNotations.basic).toBe('2d6')
    expect(commonNotations.percentile).toBe('1d100')
    expect(commonNotations.exploding).toBe('3d6!')
    expect(commonNotations.reroll).toBe('4d6R{1}')
    expect(commonNotations.cap).toBe('4d20C{>18}')
  })
})

describe('commonRollOptions', () => {
  test('contains expected roll options', () => {
    expect(commonRollOptions.d20).toEqual({ sides: 20, quantity: 1 })
    expect(commonRollOptions.d6x2).toEqual({ sides: 6, quantity: 2 })
    expect(commonRollOptions.d6x4).toEqual({ sides: 6, quantity: 4 })
    expect(commonRollOptions.advantage).toEqual({
      sides: 20,
      quantity: 2,
      modifiers: { drop: { highest: 1 } }
    })
    expect(commonRollOptions.disadvantage).toEqual({
      sides: 20,
      quantity: 2,
      modifiers: { drop: { lowest: 1 } }
    })
  })
})

describe('createNumericRollBonus', () => {
  test('creates default NumericRollBonus', () => {
    const bonus = createNumericRollBonus()

    expect(bonus.rolls).toEqual([5, 10, 15])
    expect(bonus.simpleMathModifier).toBe(0)
    expect(bonus.logs).toEqual([])
  })

  test('allows overriding rolls', () => {
    const bonus = createNumericRollBonus({ rolls: [1, 2, 3] })

    expect(bonus.rolls).toEqual([1, 2, 3])
    expect(bonus.simpleMathModifier).toBe(0)
  })

  test('allows overriding simpleMathModifier', () => {
    const bonus = createNumericRollBonus({ simpleMathModifier: 5 })

    expect(bonus.simpleMathModifier).toBe(5)
    expect(bonus.rolls).toEqual([5, 10, 15])
  })

  test('allows overriding logs', () => {
    const customLogs = [{ modifier: 'test', options: undefined, added: [1], removed: [2] }]
    const bonus = createNumericRollBonus({ logs: customLogs })

    expect(bonus.logs).toEqual(customLogs)
  })

  test('allows overriding multiple properties', () => {
    const bonus = createNumericRollBonus({
      rolls: [6, 6, 6],
      simpleMathModifier: 10,
      logs: []
    })

    expect(bonus.rolls).toEqual([6, 6, 6])
    expect(bonus.simpleMathModifier).toBe(10)
    expect(bonus.logs).toEqual([])
  })
})

describe('createRollOptions', () => {
  test('creates default RollOptions', () => {
    const options = createRollOptions()

    expect(options.sides).toBe(20)
    expect(options.quantity).toBe(1)
  })

  test('allows overriding sides', () => {
    const options = createRollOptions({ sides: 6 })

    expect(options.sides).toBe(6)
    expect(options.quantity).toBe(1)
  })

  test('allows overriding quantity', () => {
    const options = createRollOptions({ quantity: 4 })

    expect(options.sides).toBe(20)
    expect(options.quantity).toBe(4)
  })

  test('allows adding modifiers', () => {
    const options = createRollOptions({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { lowest: 1 } }
    })

    expect(options.sides).toBe(6)
    expect(options.quantity).toBe(4)
    expect(options.modifiers).toEqual({ drop: { lowest: 1 } })
  })
})

describe('createRequiredNumericRollParameters', () => {
  test('creates default parameters', () => {
    const params = createRequiredNumericRollParameters()

    expect(params.sides).toBe(6)
    expect(params.quantity).toBe(1)
  })

  test('allows overriding sides', () => {
    const params = createRequiredNumericRollParameters({ sides: 20 })

    expect(params.sides).toBe(20)
    expect(params.quantity).toBe(1)
  })

  test('allows overriding quantity', () => {
    const params = createRequiredNumericRollParameters({ quantity: 4 })

    expect(params.sides).toBe(6)
    expect(params.quantity).toBe(4)
  })

  test('allows overriding both', () => {
    const params = createRequiredNumericRollParameters({ sides: 12, quantity: 2 })

    expect(params.sides).toBe(12)
    expect(params.quantity).toBe(2)
  })
})

describe('createRollParams', () => {
  test('creates default RollParams', () => {
    const params = createRollParams()

    expect(params.sides).toBe(6)
    expect(params.quantity).toBe(1)
    expect(params.description).toEqual(['Roll 1d6'])
    expect(params.argument).toBe('1d6')
    expect(params.arithmetic).toBe('add')
    expect(params.notation).toBe('1d6')
    expect(params.modifiers).toEqual({})
    expect(params.key).toBe('Roll 1')
  })

  test('allows overriding individual properties', () => {
    const params = createRollParams({ sides: 20, quantity: 2 })

    expect(params.sides).toBe(20)
    expect(params.quantity).toBe(2)
    expect(params.description).toEqual(['Roll 1d6']) // unchanged
  })

  test('allows overriding description', () => {
    const params = createRollParams({ description: ['Custom roll'] })

    expect(params.description).toEqual(['Custom roll'])
  })

  test('allows overriding arithmetic', () => {
    const params = createRollParams({ arithmetic: 'subtract' })

    expect(params.arithmetic).toBe('subtract')
  })

  test('allows overriding modifiers', () => {
    const params = createRollParams({
      modifiers: { plus: 5, drop: { lowest: 1 } }
    })

    expect(params.modifiers).toEqual({ plus: 5, drop: { lowest: 1 } })
  })

  test('allows overriding all properties', () => {
    const params = createRollParams({
      sides: 20,
      quantity: 2,
      description: ['Roll with advantage'],
      argument: '2d20H',
      arithmetic: 'add',
      notation: '2d20H',
      modifiers: { drop: { highest: 1 } },
      key: 'advantage-roll'
    })

    expect(params.sides).toBe(20)
    expect(params.quantity).toBe(2)
    expect(params.description).toEqual(['Roll with advantage'])
    expect(params.argument).toBe('2d20H')
    expect(params.arithmetic).toBe('add')
    expect(params.notation).toBe('2d20H')
    expect(params.modifiers).toEqual({ drop: { highest: 1 } })
    expect(params.key).toBe('advantage-roll')
  })
})

describe('createMockRollOne', () => {
  test('creates function returning default value 4', () => {
    const rollOne = createMockRollOne()

    expect(rollOne()).toBe(4)
    expect(rollOne()).toBe(4) // consistent
  })

  test('creates function returning custom value', () => {
    const rollOne = createMockRollOne(6)

    expect(rollOne()).toBe(6)
  })

  test('creates function returning 1', () => {
    const rollOne = createMockRollOne(1)

    expect(rollOne()).toBe(1)
  })
})
