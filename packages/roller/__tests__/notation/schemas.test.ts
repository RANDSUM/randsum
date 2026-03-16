import { describe, expect, test } from 'bun:test'
import { coreNotationPattern } from '../../src/notation/coreNotationPattern'
import { defineNotationSchema } from '../../src/notation/schema'
import {
  capSchema,
  compoundSchema,
  countSuccessesSchema,
  dropSchema,
  explodeSchema,
  keepSchema,
  minusSchema,
  multiplySchema,
  multiplyTotalSchema,
  penetrateSchema,
  plusSchema,
  replaceSchema,
  rerollSchema,
  uniqueSchema
} from '../../src/notation/definitions'

describe('coreNotationPattern', () => {
  test('matches basic notation', () => {
    expect(coreNotationPattern.test('2d6')).toBe(true)
  })

  test('matches with sign prefix', () => {
    expect(coreNotationPattern.test('+1d20')).toBe(true)
    expect(coreNotationPattern.test('-1d6')).toBe(true)
  })

  test('does not match zero sides', () => {
    expect(coreNotationPattern.test('1d0')).toBe(false)
  })
})

describe('defineNotationSchema', () => {
  test('returns the schema unchanged', () => {
    const schema = defineNotationSchema({
      name: 'plus',
      priority: 90,
      pattern: /\+(\d+)/,
      parse: () => ({}),
      toNotation: () => undefined,
      toDescription: () => []
    })
    expect(schema.name).toBe('plus')
    expect(schema.priority).toBe(90)
  })
})

describe('capSchema', () => {
  test('parses cap notation', () => {
    const result = capSchema.parse('C{>18}')
    expect(result.cap?.greaterThan).toBe(18)
  })

  test('parses cap with less than', () => {
    const result = capSchema.parse('C{<2}')
    expect(result.cap?.lessThan).toBe(2)
  })

  test('parses cap with >= and <=', () => {
    const gte = capSchema.parse('C{>=4}')
    expect(gte.cap?.greaterThanOrEqual).toBe(4)
    const lte = capSchema.parse('C{<=2}')
    expect(lte.cap?.lessThanOrEqual).toBe(2)
  })

  test('parses cap with exact', () => {
    const result = capSchema.parse('C{4}')
    expect(result.cap?.exact).toEqual([4])
  })

  test('returns empty for no match', () => {
    expect(capSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats cap', () => {
    expect(capSchema.toNotation({ greaterThan: 18 })).toBe('C{>18}')
  })

  test('toNotation returns undefined for empty', () => {
    expect(capSchema.toNotation({})).toBeUndefined()
  })

  test('toDescription describes cap', () => {
    const result = capSchema.toDescription({ greaterThan: 18 })
    expect(result.some(d => d.includes('No Rolls'))).toBe(true)
  })

  test('toDescription describes exact cap', () => {
    const result = capSchema.toDescription({ exact: [5] })
    expect(result.some(d => d.includes('No Rolls Greater Than 5'))).toBe(true)
  })
})

describe('dropSchema', () => {
  test('parses drop highest', () => {
    const result = dropSchema.parse('H')
    expect(result.drop?.highest).toBe(1)
  })

  test('parses drop highest with count', () => {
    const result = dropSchema.parse('H2')
    expect(result.drop?.highest).toBe(2)
  })

  test('parses drop lowest', () => {
    const result = dropSchema.parse('L')
    expect(result.drop?.lowest).toBe(1)
  })

  test('parses drop lowest with count', () => {
    const result = dropSchema.parse('L3')
    expect(result.drop?.lowest).toBe(3)
  })

  test('parses drop constraints', () => {
    const result = dropSchema.parse('D{>5}')
    expect(result.drop?.greaterThan).toBe(5)
  })

  test('returns empty for no match', () => {
    expect(dropSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats highest', () => {
    expect(dropSchema.toNotation({ highest: 1 })).toBe('H')
    expect(dropSchema.toNotation({ highest: 2 })).toBe('H2')
  })

  test('toNotation formats lowest', () => {
    expect(dropSchema.toNotation({ lowest: 1 })).toBe('L')
    expect(dropSchema.toNotation({ lowest: 2 })).toBe('L2')
  })

  test('toNotation formats constraints', () => {
    expect(dropSchema.toNotation({ greaterThan: 5 })).toBe('D{>5}')
  })

  test('toNotation formats exact values', () => {
    expect(dropSchema.toNotation({ exact: [1, 2] })).toBe('D{1,2}')
  })

  test('toNotation formats gte/lte', () => {
    expect(dropSchema.toNotation({ greaterThanOrEqual: 5 })).toBe('D{>=5}')
    expect(dropSchema.toNotation({ lessThanOrEqual: 2 })).toBe('D{<=2}')
  })

  test('toNotation returns undefined for empty', () => {
    expect(dropSchema.toNotation({})).toBeUndefined()
  })

  test('toDescription describes highest', () => {
    expect(dropSchema.toDescription({ highest: 1 })).toContain('Drop highest')
    expect(dropSchema.toDescription({ highest: 2 })).toContain('Drop highest 2')
  })

  test('toDescription describes lowest', () => {
    expect(dropSchema.toDescription({ lowest: 1 })).toContain('Drop lowest')
    expect(dropSchema.toDescription({ lowest: 2 })).toContain('Drop lowest 2')
  })

  test('toDescription describes exact', () => {
    const result = dropSchema.toDescription({ exact: [1, 2] })
    expect(result.some(d => d.includes('Drop'))).toBe(true)
  })

  test('toDescription describes comparison conditions', () => {
    expect(dropSchema.toDescription({ greaterThan: 5 })).toContain('Drop greater than 5')
    expect(dropSchema.toDescription({ lessThan: 2 })).toContain('Drop less than 2')
    expect(dropSchema.toDescription({ greaterThanOrEqual: 5 })).toContain(
      'Drop greater than or equal to 5'
    )
    expect(dropSchema.toDescription({ lessThanOrEqual: 2 })).toContain(
      'Drop less than or equal to 2'
    )
  })
})

describe('keepSchema', () => {
  test('parses keep highest', () => {
    const result = keepSchema.parse('K')
    expect(result.keep?.highest).toBe(1)
  })

  test('parses keep highest with count', () => {
    const result = keepSchema.parse('K3')
    expect(result.keep?.highest).toBe(3)
  })

  test('parses keep lowest', () => {
    const result = keepSchema.parse('kl')
    expect(result.keep?.lowest).toBe(1)
  })

  test('parses keep lowest with count', () => {
    const result = keepSchema.parse('kl2')
    expect(result.keep?.lowest).toBe(2)
  })

  test('returns empty for no match', () => {
    expect(keepSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats keep', () => {
    expect(keepSchema.toNotation({ highest: 1 })).toBe('K')
    expect(keepSchema.toNotation({ highest: 3 })).toBe('K3')
    expect(keepSchema.toNotation({ lowest: 1 })).toBe('kl')
    expect(keepSchema.toNotation({ lowest: 2 })).toBe('kl2')
  })

  test('toNotation returns undefined for empty', () => {
    expect(keepSchema.toNotation({})).toBeUndefined()
  })

  test('toDescription describes keep', () => {
    expect(keepSchema.toDescription({ highest: 1 })).toContain('Keep highest')
    expect(keepSchema.toDescription({ highest: 3 })).toContain('Keep highest 3')
    expect(keepSchema.toDescription({ lowest: 1 })).toContain('Keep lowest')
    expect(keepSchema.toDescription({ lowest: 2 })).toContain('Keep lowest 2')
  })
})

describe('replaceSchema', () => {
  test('parses basic replace', () => {
    const result = replaceSchema.parse('V{1=6}')
    expect(result.replace).toEqual([{ from: 1, to: 6 }])
  })

  test('parses multiple replacements', () => {
    const result = replaceSchema.parse('V{1=6,2=5}')
    expect(result.replace).toEqual([
      { from: 1, to: 6 },
      { from: 2, to: 5 }
    ])
  })

  test('parses comparison-based replace', () => {
    const result = replaceSchema.parse('V{>5=6}')
    expect(result.replace).toBeDefined()
    if (Array.isArray(result.replace)) {
      expect(result.replace[0]?.from).toEqual({ greaterThan: 5 })
      expect(result.replace[0]?.to).toBe(6)
    }
  })

  test('parses >=, <=, < based replace', () => {
    const ge = replaceSchema.parse('V{>=5=6}')
    if (Array.isArray(ge.replace)) {
      expect(ge.replace[0]?.from).toEqual({ greaterThanOrEqual: 5 })
    }

    const le = replaceSchema.parse('V{<=2=3}')
    if (Array.isArray(le.replace)) {
      expect(le.replace[0]?.from).toEqual({ lessThanOrEqual: 2 })
    }

    const lt = replaceSchema.parse('V{<2=3}')
    if (Array.isArray(lt.replace)) {
      expect(lt.replace[0]?.from).toEqual({ lessThan: 2 })
    }
  })

  test('returns empty for no match', () => {
    expect(replaceSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats replace', () => {
    expect(replaceSchema.toNotation({ from: 1, to: 6 })).toBe('V{1=6}')
  })

  test('toNotation formats replace array', () => {
    expect(
      replaceSchema.toNotation([
        { from: 1, to: 6 },
        { from: 2, to: 5 }
      ])
    ).toBe('V{1=6,2=5}')
  })

  test('toNotation formats comparison-based replace', () => {
    expect(replaceSchema.toNotation({ from: { greaterThan: 5 }, to: 6 })).toBe('V{>5=6}')
  })

  test('toDescription describes replace', () => {
    expect(replaceSchema.toDescription({ from: 1, to: 6 })).toContain('Replace 1 with 6')
  })

  test('toDescription describes comparison replace', () => {
    const result = replaceSchema.toDescription({ from: { greaterThan: 5 }, to: 6 })
    expect(result[0]).toContain('Replace')
    expect(result[0]).toContain('6')
  })
})

describe('rerollSchema', () => {
  test('parses reroll exact', () => {
    const result = rerollSchema.parse('R{1}')
    expect(result.reroll?.exact).toEqual([1])
  })

  test('parses reroll with max', () => {
    const result = rerollSchema.parse('R{1}3')
    expect(result.reroll?.exact).toEqual([1])
    expect(result.reroll?.max).toBe(3)
  })

  test('parses reroll with comparison', () => {
    const result = rerollSchema.parse('R{<3}')
    expect(result.reroll?.lessThan).toBe(3)
  })

  test('returns empty for no match', () => {
    expect(rerollSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats reroll', () => {
    expect(rerollSchema.toNotation({ exact: [1] })).toBe('R{1}')
  })

  test('toNotation formats reroll with max', () => {
    expect(rerollSchema.toNotation({ exact: [1], max: 3 })).toBe('R{1}3')
  })

  test('toNotation returns undefined for empty', () => {
    expect(rerollSchema.toNotation({})).toBeUndefined()
  })

  test('toDescription describes reroll', () => {
    const result = rerollSchema.toDescription({ exact: [1] })
    expect(result[0]).toContain('Reroll')
  })

  test('toDescription describes reroll with max', () => {
    const result = rerollSchema.toDescription({ exact: [1], max: 3 })
    expect(result[0]).toContain('up to 3 times')
  })

  test('toDescription describes reroll with comparison', () => {
    const result = rerollSchema.toDescription({ greaterThan: 5 })
    expect(result[0]).toContain('greater than 5')
  })

  test('toDescription describes reroll with gte/lte', () => {
    const gte = rerollSchema.toDescription({ greaterThanOrEqual: 5 })
    expect(gte[0]).toContain('greater than or equal to 5')
    const lte = rerollSchema.toDescription({ lessThanOrEqual: 2 })
    expect(lte[0]).toContain('less than or equal to 2')
  })

  test('toDescription returns empty for no conditions', () => {
    expect(rerollSchema.toDescription({})).toEqual([])
  })
})

describe('explodeSchema', () => {
  test('parses explode', () => {
    expect(explodeSchema.parse('!')).toEqual({ explode: true })
  })

  test('does not match compound', () => {
    expect(explodeSchema.parse('!!')).toEqual({})
  })

  test('returns empty for no match', () => {
    expect(explodeSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats explode', () => {
    expect(explodeSchema.toNotation(true)).toBe('!')
    expect(explodeSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription describes explode', () => {
    expect(explodeSchema.toDescription(true)).toEqual(['Exploding Dice'])
    expect(explodeSchema.toDescription(false)).toEqual([])
  })
})

describe('compoundSchema', () => {
  test('parses compound', () => {
    expect(compoundSchema.parse('!!')).toEqual({ compound: true })
  })

  test('parses compound with depth', () => {
    expect(compoundSchema.parse('!!3')).toEqual({ compound: 3 })
  })

  test('returns empty for no match', () => {
    expect(compoundSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats compound', () => {
    expect(compoundSchema.toNotation(true)).toBe('!!')
    expect(compoundSchema.toNotation(3)).toBe('!!3')
    expect(compoundSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription describes compound', () => {
    expect(compoundSchema.toDescription(true)).toEqual(['Compounding Dice'])
    expect(compoundSchema.toDescription(0)).toEqual(['Compounding Dice (unlimited)'])
    expect(compoundSchema.toDescription(3)).toEqual(['Compounding Dice (max 3 times)'])
    expect(compoundSchema.toDescription(false)).toEqual([])
  })
})

describe('penetrateSchema', () => {
  test('parses penetrate', () => {
    expect(penetrateSchema.parse('!p')).toEqual({ penetrate: true })
  })

  test('parses penetrate with depth', () => {
    expect(penetrateSchema.parse('!p3')).toEqual({ penetrate: 3 })
  })

  test('returns empty for no match', () => {
    expect(penetrateSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats penetrate', () => {
    expect(penetrateSchema.toNotation(true)).toBe('!p')
    expect(penetrateSchema.toNotation(3)).toBe('!p3')
    expect(penetrateSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription describes penetrate', () => {
    expect(penetrateSchema.toDescription(true)).toEqual(['Penetrating Dice'])
    expect(penetrateSchema.toDescription(0)).toEqual(['Penetrating Dice (unlimited)'])
    expect(penetrateSchema.toDescription(3)).toEqual(['Penetrating Dice (max 3 times)'])
    expect(penetrateSchema.toDescription(false)).toEqual([])
  })
})

describe('uniqueSchema', () => {
  test('parses unique', () => {
    expect(uniqueSchema.parse('U')).toEqual({ unique: true })
  })

  test('parses unique with exceptions', () => {
    const result = uniqueSchema.parse('U{1,6}')
    expect(result.unique).toEqual({ notUnique: [1, 6] })
  })

  test('returns empty for no match', () => {
    expect(uniqueSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats unique', () => {
    expect(uniqueSchema.toNotation(true)).toBe('U')
    expect(uniqueSchema.toNotation({ notUnique: [1, 6] })).toBe('U{1,6}')
    expect(uniqueSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription describes unique', () => {
    expect(uniqueSchema.toDescription(true)).toEqual(['No Duplicate Rolls'])
    expect(uniqueSchema.toDescription({ notUnique: [1, 6] })).toEqual([
      'No Duplicates (except 1 and 6)'
    ])
    expect(uniqueSchema.toDescription(false)).toEqual([])
  })
})

describe('countSuccessesSchema', () => {
  test('parses count successes', () => {
    expect(countSuccessesSchema.parse('S{5}')).toEqual({
      count: { greaterThanOrEqual: 5 }
    })
  })

  test('parses count successes with botch', () => {
    expect(countSuccessesSchema.parse('S{5,1}')).toEqual({
      count: { greaterThanOrEqual: 5, lessThanOrEqual: 1, deduct: true }
    })
  })

  test('returns empty for no match', () => {
    expect(countSuccessesSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats count successes', () => {
    expect(countSuccessesSchema.toNotation({ greaterThanOrEqual: 5 })).toBe('S{5}')
    expect(
      countSuccessesSchema.toNotation({ greaterThanOrEqual: 5, lessThanOrEqual: 1, deduct: true })
    ).toBe('S{5,1}')
  })

  test('toDescription describes count successes', () => {
    expect(countSuccessesSchema.toDescription({ greaterThanOrEqual: 5 })).toEqual([
      'Count successes >= 5'
    ])
    expect(
      countSuccessesSchema.toDescription({
        greaterThanOrEqual: 5,
        lessThanOrEqual: 1,
        deduct: true
      })
    ).toEqual(['Count successes >= 5, botches <= 1'])
  })
})

describe('multiplySchema', () => {
  test('parses multiply', () => {
    expect(multiplySchema.parse('*3')).toEqual({ multiply: 3 })
  })

  test('does not match multiplyTotal', () => {
    expect(multiplySchema.parse('**3')).toEqual({})
  })

  test('returns empty for no match', () => {
    expect(multiplySchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats multiply', () => {
    expect(multiplySchema.toNotation(3)).toBe('*3')
  })

  test('toDescription describes multiply', () => {
    expect(multiplySchema.toDescription(3)).toEqual(['Multiply dice by 3'])
  })
})

describe('multiplyTotalSchema', () => {
  test('parses multiplyTotal', () => {
    expect(multiplyTotalSchema.parse('**3')).toEqual({ multiplyTotal: 3 })
  })

  test('returns empty for no match', () => {
    expect(multiplyTotalSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats multiplyTotal', () => {
    expect(multiplyTotalSchema.toNotation(3)).toBe('**3')
  })

  test('toDescription describes multiplyTotal', () => {
    expect(multiplyTotalSchema.toDescription(3)).toEqual(['Multiply total by 3'])
  })
})

describe('plusSchema', () => {
  test('parses plus', () => {
    const result = plusSchema.parse('+5')
    expect(result.plus).toBe(5)
  })

  test('parses multiple plus', () => {
    const result = plusSchema.parse('+3+2')
    expect(result.plus).toBe(5)
  })

  test('returns empty for no match', () => {
    expect(plusSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats plus', () => {
    expect(plusSchema.toNotation(5)).toBe('+5')
  })

  test('toNotation formats negative plus as minus', () => {
    expect(plusSchema.toNotation(-3)).toBe('-3')
  })

  test('toDescription describes plus', () => {
    expect(plusSchema.toDescription(5)).toEqual(['Add 5'])
  })
})

describe('minusSchema', () => {
  test('parses minus', () => {
    const result = minusSchema.parse('-3')
    expect(result.minus).toBe(3)
  })

  test('returns empty for no match', () => {
    expect(minusSchema.parse('2d6')).toEqual({})
  })

  test('toNotation formats minus', () => {
    expect(minusSchema.toNotation(3)).toBe('-3')
  })

  test('toDescription describes minus', () => {
    expect(minusSchema.toDescription(3)).toEqual(['Subtract 3'])
  })
})
