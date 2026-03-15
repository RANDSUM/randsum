import { describe, expect, test } from 'bun:test'
import { capSchema } from '../src/definitions/cap'
import { dropSchema } from '../src/definitions/drop'
import { keepSchema } from '../src/definitions/keep'
import { replaceSchema } from '../src/definitions/replace'
import { rerollSchema } from '../src/definitions/reroll'
import { uniqueSchema } from '../src/definitions/unique'
import { compoundSchema } from '../src/definitions/compound'
import { penetrateSchema } from '../src/definitions/penetrate'
import { explodeSchema } from '../src/definitions/explode'
import { countSuccessesSchema } from '../src/definitions/countSuccesses'
import { multiplySchema } from '../src/definitions/multiply'
import { multiplyTotalSchema } from '../src/definitions/multiplyTotal'
import { plusSchema } from '../src/definitions/plus'
import { minusSchema } from '../src/definitions/minus'

describe('capSchema', () => {
  describe('parse', () => {
    test('parses greater than', () => {
      expect(capSchema.parse('C{>5}')).toEqual({ cap: { greaterThan: 5 } })
    })

    test('parses less than', () => {
      expect(capSchema.parse('C{<3}')).toEqual({ cap: { lessThan: 3 } })
    })

    test('parses greater than or equal', () => {
      expect(capSchema.parse('C{>=4}')).toEqual({
        cap: { greaterThanOrEqual: 4 }
      })
    })

    test('parses less than or equal', () => {
      expect(capSchema.parse('C{<=8}')).toEqual({
        cap: { lessThanOrEqual: 8 }
      })
    })

    test('parses combined comparison', () => {
      expect(capSchema.parse('C{>=4,<=8}')).toEqual({
        cap: { greaterThanOrEqual: 4, lessThanOrEqual: 8 }
      })
    })

    test('parses exact value (bare number)', () => {
      expect(capSchema.parse('C{5}')).toEqual({ cap: { exact: [5] } })
    })

    test('parses exact value with = prefix', () => {
      expect(capSchema.parse('C{=5}')).toEqual({ cap: { exact: [5] } })
    })

    test('returns empty object for no match', () => {
      expect(capSchema.parse('no match')).toEqual({})
    })

    test('parses lowercase c', () => {
      expect(capSchema.parse('c{>5}')).toEqual({ cap: { greaterThan: 5 } })
    })
  })

  describe('toNotation', () => {
    test('formats greater than', () => {
      expect(capSchema.toNotation({ greaterThan: 5 })).toBe('C{>5}')
    })

    test('formats less than', () => {
      expect(capSchema.toNotation({ lessThan: 3 })).toBe('C{<3}')
    })

    test('formats greater than or equal', () => {
      expect(capSchema.toNotation({ greaterThanOrEqual: 4 })).toBe('C{>=4}')
    })

    test('formats less than or equal', () => {
      expect(capSchema.toNotation({ lessThanOrEqual: 8 })).toBe('C{<=8}')
    })

    test('returns undefined for empty options', () => {
      expect(capSchema.toNotation({})).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes greater than', () => {
      expect(capSchema.toDescription({ greaterThan: 5 })).toEqual(['No Rolls greater than 5'])
    })

    test('describes less than', () => {
      expect(capSchema.toDescription({ lessThan: 3 })).toEqual(['No Rolls less than 3'])
    })

    test('describes exact values', () => {
      expect(capSchema.toDescription({ exact: [5] })).toEqual(['No Rolls Greater Than 5'])
    })

    test('describes combined', () => {
      const result = capSchema.toDescription({
        exact: [5],
        greaterThan: 10
      })
      expect(result).toContain('No Rolls Greater Than 5')
      expect(result).toContain('No Rolls greater than 10')
    })
  })
})

describe('dropSchema', () => {
  describe('parse', () => {
    test('parses H (drop highest 1)', () => {
      expect(dropSchema.parse('H')).toEqual({ drop: { highest: 1 } })
    })

    test('parses H3 (drop highest 3)', () => {
      expect(dropSchema.parse('H3')).toEqual({ drop: { highest: 3 } })
    })

    test('parses L (drop lowest 1)', () => {
      expect(dropSchema.parse('L')).toEqual({ drop: { lowest: 1 } })
    })

    test('parses L2 (drop lowest 2)', () => {
      expect(dropSchema.parse('L2')).toEqual({ drop: { lowest: 2 } })
    })

    test('parses D{>5} (drop greater than)', () => {
      expect(dropSchema.parse('D{>5}')).toEqual({
        drop: { greaterThan: 5 }
      })
    })

    test('parses D{<3} (drop less than)', () => {
      expect(dropSchema.parse('D{<3}')).toEqual({ drop: { lessThan: 3 } })
    })

    test('parses D{>=4} (drop greater than or equal)', () => {
      expect(dropSchema.parse('D{>=4}')).toEqual({
        drop: { greaterThanOrEqual: 4 }
      })
    })

    test('parses D{<=2} (drop less than or equal)', () => {
      expect(dropSchema.parse('D{<=2}')).toEqual({
        drop: { lessThanOrEqual: 2 }
      })
    })

    test('parses D{=5} (drop exact)', () => {
      expect(dropSchema.parse('D{=5}')).toEqual({ drop: { exact: [5] } })
    })

    test('parses D{5} (drop bare number as exact)', () => {
      expect(dropSchema.parse('D{5}')).toEqual({ drop: { exact: [5] } })
    })

    test('parses D{<3,>8} (drop combined)', () => {
      expect(dropSchema.parse('D{<3,>8}')).toEqual({
        drop: { lessThan: 3, greaterThan: 8 }
      })
    })

    test('returns empty object for no match', () => {
      expect(dropSchema.parse('zzz')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats highest 1', () => {
      expect(dropSchema.toNotation({ highest: 1 })).toBe('H')
    })

    test('formats highest N', () => {
      expect(dropSchema.toNotation({ highest: 3 })).toBe('H3')
    })

    test('formats lowest 1', () => {
      expect(dropSchema.toNotation({ lowest: 1 })).toBe('L')
    })

    test('formats lowest N', () => {
      expect(dropSchema.toNotation({ lowest: 2 })).toBe('L2')
    })

    test('formats comparison drop', () => {
      expect(dropSchema.toNotation({ greaterThan: 5 })).toBe('D{>5}')
    })

    test('formats exact drop', () => {
      expect(dropSchema.toNotation({ exact: [5] })).toBe('D{5}')
    })

    test('returns undefined for empty options', () => {
      expect(dropSchema.toNotation({})).toBeUndefined()
    })

    test('formats combined highest and lowest', () => {
      expect(dropSchema.toNotation({ highest: 1, lowest: 1 })).toBe('HL')
    })
  })

  describe('toDescription', () => {
    test('describes drop highest', () => {
      expect(dropSchema.toDescription({ highest: 1 })).toEqual(['Drop highest'])
    })

    test('describes drop highest N', () => {
      expect(dropSchema.toDescription({ highest: 3 })).toEqual(['Drop highest 3'])
    })

    test('describes drop lowest', () => {
      expect(dropSchema.toDescription({ lowest: 1 })).toEqual(['Drop lowest'])
    })

    test('describes drop lowest N', () => {
      expect(dropSchema.toDescription({ lowest: 2 })).toEqual(['Drop lowest 2'])
    })

    test('describes exact drop', () => {
      expect(dropSchema.toDescription({ exact: [5] })).toEqual(['Drop 5'])
    })

    test('describes greater than drop', () => {
      expect(dropSchema.toDescription({ greaterThan: 5 })).toEqual(['Drop greater than 5'])
    })

    test('describes greater than or equal drop', () => {
      expect(dropSchema.toDescription({ greaterThanOrEqual: 4 })).toEqual([
        'Drop greater than or equal to 4'
      ])
    })

    test('describes less than drop', () => {
      expect(dropSchema.toDescription({ lessThan: 3 })).toEqual(['Drop less than 3'])
    })

    test('describes less than or equal drop', () => {
      expect(dropSchema.toDescription({ lessThanOrEqual: 2 })).toEqual([
        'Drop less than or equal to 2'
      ])
    })
  })
})

describe('keepSchema', () => {
  describe('parse', () => {
    test('parses K (keep highest 1)', () => {
      expect(keepSchema.parse('K')).toEqual({ keep: { highest: 1 } })
    })

    test('parses K3 (keep highest 3)', () => {
      expect(keepSchema.parse('K3')).toEqual({ keep: { highest: 3 } })
    })

    test('parses kl (keep lowest 1)', () => {
      expect(keepSchema.parse('kl')).toEqual({ keep: { lowest: 1 } })
    })

    test('parses KL (keep lowest 1, uppercase)', () => {
      expect(keepSchema.parse('KL')).toEqual({ keep: { lowest: 1 } })
    })

    test('parses kl2 (keep lowest 2)', () => {
      expect(keepSchema.parse('kl2')).toEqual({ keep: { lowest: 2 } })
    })

    test('parses KL2 (keep lowest 2, uppercase)', () => {
      expect(keepSchema.parse('KL2')).toEqual({ keep: { lowest: 2 } })
    })

    test('returns empty object for no match', () => {
      expect(keepSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats keep highest 1', () => {
      expect(keepSchema.toNotation({ highest: 1 })).toBe('K')
    })

    test('formats keep highest N', () => {
      expect(keepSchema.toNotation({ highest: 3 })).toBe('K3')
    })

    test('formats keep lowest 1', () => {
      expect(keepSchema.toNotation({ lowest: 1 })).toBe('kl')
    })

    test('formats keep lowest N', () => {
      expect(keepSchema.toNotation({ lowest: 2 })).toBe('kl2')
    })

    test('returns undefined for empty options', () => {
      expect(keepSchema.toNotation({})).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes keep highest', () => {
      expect(keepSchema.toDescription({ highest: 1 })).toEqual(['Keep highest'])
    })

    test('describes keep highest N', () => {
      expect(keepSchema.toDescription({ highest: 3 })).toEqual(['Keep highest 3'])
    })

    test('describes keep lowest', () => {
      expect(keepSchema.toDescription({ lowest: 1 })).toEqual(['Keep lowest'])
    })

    test('describes keep lowest N', () => {
      expect(keepSchema.toDescription({ lowest: 2 })).toEqual(['Keep lowest 2'])
    })
  })

  describe('keep middle (KM) parsing', () => {
    test('parses KM (keep middle, drop 1 from each end)', () => {
      expect(keepSchema.parse('KM')).toEqual({
        drop: { lowest: 1, highest: 1 }
      })
    })

    test('parses KM2 (keep middle, drop 2 from each end)', () => {
      expect(keepSchema.parse('KM2')).toEqual({
        drop: { lowest: 2, highest: 2 }
      })
    })

    test('parses km (lowercase)', () => {
      expect(keepSchema.parse('km')).toEqual({
        drop: { lowest: 1, highest: 1 }
      })
    })

    test('parses Km (mixed case)', () => {
      expect(keepSchema.parse('Km')).toEqual({
        drop: { lowest: 1, highest: 1 }
      })
    })

    test('parses kM (mixed case)', () => {
      expect(keepSchema.parse('kM')).toEqual({
        drop: { lowest: 1, highest: 1 }
      })
    })

    test('parses km3 (lowercase with count)', () => {
      expect(keepSchema.parse('km3')).toEqual({
        drop: { lowest: 3, highest: 3 }
      })
    })
  })
})

describe('replaceSchema', () => {
  describe('parse', () => {
    test('parses V{1=6} (replace 1 with 6)', () => {
      expect(replaceSchema.parse('V{1=6}')).toEqual({
        replace: [{ from: 1, to: 6 }]
      })
    })

    test('parses V{1=6,2=5} (multiple replacements)', () => {
      expect(replaceSchema.parse('V{1=6,2=5}')).toEqual({
        replace: [
          { from: 1, to: 6 },
          { from: 2, to: 5 }
        ]
      })
    })

    test('parses V{>5=6} (replace greater than)', () => {
      expect(replaceSchema.parse('V{>5=6}')).toEqual({
        replace: [{ from: { greaterThan: 5 }, to: 6 }]
      })
    })

    test('parses V{<3=1} (replace less than)', () => {
      expect(replaceSchema.parse('V{<3=1}')).toEqual({
        replace: [{ from: { lessThan: 3 }, to: 1 }]
      })
    })

    test('parses V{>=4=5} (replace greater than or equal)', () => {
      expect(replaceSchema.parse('V{>=4=5}')).toEqual({
        replace: [{ from: { greaterThanOrEqual: 4 }, to: 5 }]
      })
    })

    test('parses V{<=2=1} (replace less than or equal)', () => {
      expect(replaceSchema.parse('V{<=2=1}')).toEqual({
        replace: [{ from: { lessThanOrEqual: 2 }, to: 1 }]
      })
    })

    test('returns empty object for no match', () => {
      expect(replaceSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats basic replacement', () => {
      expect(replaceSchema.toNotation({ from: 1, to: 6 })).toBe('V{1=6}')
    })

    test('formats array of replacements', () => {
      expect(
        replaceSchema.toNotation([
          { from: 1, to: 6 },
          { from: 2, to: 5 }
        ])
      ).toBe('V{1=6,2=5}')
    })

    test('formats comparison from', () => {
      expect(replaceSchema.toNotation({ from: { greaterThan: 5 }, to: 6 })).toBe('V{>5=6}')
    })
  })

  describe('toDescription', () => {
    test('describes basic replacement', () => {
      expect(replaceSchema.toDescription({ from: 1, to: 6 })).toEqual(['Replace 1 with 6'])
    })

    test('describes array of replacements', () => {
      expect(
        replaceSchema.toDescription([
          { from: 1, to: 6 },
          { from: 2, to: 5 }
        ])
      ).toEqual(['Replace 1 with 6', 'Replace 2 with 5'])
    })

    test('describes comparison replacement', () => {
      expect(
        replaceSchema.toDescription({
          from: { greaterThan: 5 },
          to: 6
        })
      ).toEqual(['Replace greater than 5 with 6'])
    })
  })
})

describe('rerollSchema', () => {
  describe('parse', () => {
    test('parses R{1} (reroll exact 1)', () => {
      expect(rerollSchema.parse('R{1}')).toEqual({
        reroll: { exact: [1] }
      })
    })

    test('parses R{1,2} (reroll exact 1 and 2)', () => {
      expect(rerollSchema.parse('R{1,2}')).toEqual({
        reroll: { exact: [1, 2] }
      })
    })

    test('parses R{<3} (reroll less than)', () => {
      expect(rerollSchema.parse('R{<3}')).toEqual({
        reroll: { lessThan: 3 }
      })
    })

    test('parses R{>5} (reroll greater than)', () => {
      expect(rerollSchema.parse('R{>5}')).toEqual({
        reroll: { greaterThan: 5 }
      })
    })

    test('parses R{>=4} (reroll greater than or equal)', () => {
      expect(rerollSchema.parse('R{>=4}')).toEqual({
        reroll: { greaterThanOrEqual: 4 }
      })
    })

    test('parses R{<=2} (reroll less than or equal)', () => {
      expect(rerollSchema.parse('R{<=2}')).toEqual({
        reroll: { lessThanOrEqual: 2 }
      })
    })

    test('parses R{1}3 (reroll with max count)', () => {
      expect(rerollSchema.parse('R{1}3')).toEqual({
        reroll: { exact: [1], max: 3 }
      })
    })

    test('returns empty object for no match', () => {
      expect(rerollSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats exact reroll', () => {
      expect(rerollSchema.toNotation({ exact: [1] })).toBe('R{1}')
    })

    test('formats comparison reroll', () => {
      expect(rerollSchema.toNotation({ lessThan: 3 })).toBe('R{<3}')
    })

    test('formats reroll with max', () => {
      expect(rerollSchema.toNotation({ exact: [1], max: 3 })).toBe('R{1}3')
    })

    test('returns undefined for empty options', () => {
      expect(rerollSchema.toNotation({})).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes exact reroll', () => {
      expect(rerollSchema.toDescription({ exact: [1] })).toEqual(['Reroll 1'])
    })

    test('describes comparison reroll', () => {
      expect(rerollSchema.toDescription({ greaterThan: 5 })).toEqual(['Reroll greater than 5'])
    })

    test('describes reroll with max', () => {
      expect(rerollSchema.toDescription({ exact: [1], max: 3 })).toEqual([
        'Reroll 1 (up to 3 times)'
      ])
    })

    test('returns empty for no conditions', () => {
      expect(rerollSchema.toDescription({})).toEqual([])
    })

    test('describes combined exact and comparison', () => {
      const result = rerollSchema.toDescription({
        exact: [1],
        greaterThan: 5
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('Reroll')
      expect(result[0]).toContain('1')
      expect(result[0]).toContain('greater than 5')
    })

    test('describes less than or equal', () => {
      expect(rerollSchema.toDescription({ lessThanOrEqual: 2 })).toEqual([
        'Reroll less than or equal to 2'
      ])
    })

    test('describes greater than or equal', () => {
      expect(rerollSchema.toDescription({ greaterThanOrEqual: 4 })).toEqual([
        'Reroll greater than or equal to 4'
      ])
    })

    test('describes reroll once (max 1)', () => {
      expect(rerollSchema.toDescription({ exact: [1], max: 1 })).toEqual(['Reroll once 1'])
    })

    test('describes reroll once with comparison', () => {
      expect(rerollSchema.toDescription({ lessThan: 3, max: 1 })).toEqual([
        'Reroll once less than 3'
      ])
    })
  })

  describe('reroll once (ro) parsing', () => {
    test('parses ro{1} (reroll once exact 1)', () => {
      expect(rerollSchema.parse('ro{1}')).toEqual({
        reroll: { exact: [1], max: 1 }
      })
    })

    test('parses RO{<3} (reroll once less than, uppercase)', () => {
      expect(rerollSchema.parse('RO{<3}')).toEqual({
        reroll: { lessThan: 3, max: 1 }
      })
    })

    test('parses Ro{>5} (reroll once greater than, mixed case)', () => {
      expect(rerollSchema.parse('Ro{>5}')).toEqual({
        reroll: { greaterThan: 5, max: 1 }
      })
    })

    test('parses rO{>=4} (reroll once greater than or equal)', () => {
      expect(rerollSchema.parse('rO{>=4}')).toEqual({
        reroll: { greaterThanOrEqual: 4, max: 1 }
      })
    })

    test('parses ro{<=2} (reroll once less than or equal)', () => {
      expect(rerollSchema.parse('ro{<=2}')).toEqual({
        reroll: { lessThanOrEqual: 2, max: 1 }
      })
    })

    test('parses ro{=5} (reroll once exact with = prefix)', () => {
      expect(rerollSchema.parse('ro{=5}')).toEqual({
        reroll: { exact: [5], max: 1 }
      })
    })

    test('parses ro{1,2} (reroll once multiple exact values)', () => {
      expect(rerollSchema.parse('ro{1,2}')).toEqual({
        reroll: { exact: [1, 2], max: 1 }
      })
    })
  })

  describe('reroll once (ro) toNotation', () => {
    test('formats max 1 as ro notation', () => {
      expect(rerollSchema.toNotation({ exact: [1], max: 1 })).toBe('ro{1}')
    })

    test('formats max 1 with comparison as ro notation', () => {
      expect(rerollSchema.toNotation({ lessThan: 3, max: 1 })).toBe('ro{<3}')
    })

    test('formats max > 1 as R notation (not ro)', () => {
      expect(rerollSchema.toNotation({ exact: [1], max: 3 })).toBe('R{1}3')
    })
  })
})

describe('uniqueSchema', () => {
  describe('parse', () => {
    test('parses U (unique)', () => {
      expect(uniqueSchema.parse('U')).toEqual({ unique: true })
    })

    test('parses U{1,6} (unique with exceptions)', () => {
      expect(uniqueSchema.parse('U{1,6}')).toEqual({
        unique: { notUnique: [1, 6] }
      })
    })

    test('returns empty for no match', () => {
      expect(uniqueSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats true as U', () => {
      expect(uniqueSchema.toNotation(true)).toBe('U')
    })

    test('formats object with notUnique', () => {
      expect(uniqueSchema.toNotation({ notUnique: [1, 6] })).toBe('U{1,6}')
    })

    test('returns undefined for false', () => {
      expect(uniqueSchema.toNotation(false)).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes true as No Duplicate Rolls', () => {
      expect(uniqueSchema.toDescription(true)).toEqual(['No Duplicate Rolls'])
    })

    test('describes object with exceptions', () => {
      const result = uniqueSchema.toDescription({ notUnique: [1, 6] })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('No Duplicates')
      expect(result[0]).toContain('except')
    })

    test('returns empty for false', () => {
      expect(uniqueSchema.toDescription(false)).toEqual([])
    })
  })
})

describe('compoundSchema', () => {
  describe('parse', () => {
    test('parses !! (compound)', () => {
      expect(compoundSchema.parse('!!')).toEqual({ compound: true })
    })

    test('parses !!3 (compound with depth)', () => {
      expect(compoundSchema.parse('!!3')).toEqual({ compound: 3 })
    })

    test('parses !!0 (compound unlimited)', () => {
      expect(compoundSchema.parse('!!0')).toEqual({ compound: 0 })
    })

    test('returns empty for no match', () => {
      expect(compoundSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats true as !!', () => {
      expect(compoundSchema.toNotation(true)).toBe('!!')
    })

    test('formats number as !!N', () => {
      expect(compoundSchema.toNotation(5)).toBe('!!5')
    })

    test('returns undefined for false', () => {
      expect(compoundSchema.toNotation(false)).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes true', () => {
      expect(compoundSchema.toDescription(true)).toEqual(['Compounding Dice'])
    })

    test('describes 0 (unlimited)', () => {
      expect(compoundSchema.toDescription(0)).toEqual(['Compounding Dice (unlimited)'])
    })

    test('describes number (max N times)', () => {
      expect(compoundSchema.toDescription(5)).toEqual(['Compounding Dice (max 5 times)'])
    })

    test('returns empty for false', () => {
      expect(compoundSchema.toDescription(false)).toEqual([])
    })
  })
})

describe('penetrateSchema', () => {
  describe('parse', () => {
    test('parses !p (penetrate)', () => {
      expect(penetrateSchema.parse('!p')).toEqual({ penetrate: true })
    })

    test('parses !p3 (penetrate with depth)', () => {
      expect(penetrateSchema.parse('!p3')).toEqual({ penetrate: 3 })
    })

    test('parses !p0 (penetrate unlimited)', () => {
      expect(penetrateSchema.parse('!p0')).toEqual({ penetrate: 0 })
    })

    test('parses !P (case insensitive)', () => {
      expect(penetrateSchema.parse('!P')).toEqual({ penetrate: true })
    })

    test('returns empty for no match', () => {
      expect(penetrateSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats true as !p', () => {
      expect(penetrateSchema.toNotation(true)).toBe('!p')
    })

    test('formats number as !pN', () => {
      expect(penetrateSchema.toNotation(5)).toBe('!p5')
    })

    test('returns undefined for false', () => {
      expect(penetrateSchema.toNotation(false)).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes true', () => {
      expect(penetrateSchema.toDescription(true)).toEqual(['Penetrating Dice'])
    })

    test('describes 0 (unlimited)', () => {
      expect(penetrateSchema.toDescription(0)).toEqual(['Penetrating Dice (unlimited)'])
    })

    test('describes number (max N times)', () => {
      expect(penetrateSchema.toDescription(5)).toEqual(['Penetrating Dice (max 5 times)'])
    })

    test('returns empty for false', () => {
      expect(penetrateSchema.toDescription(false)).toEqual([])
    })
  })
})

describe('explodeSchema', () => {
  describe('parse', () => {
    test('parses ! (explode)', () => {
      expect(explodeSchema.parse('!')).toEqual({ explode: true })
    })

    test('does not match !! (compound)', () => {
      expect(explodeSchema.parse('!!')).toEqual({})
    })

    test('does not match !p (penetrate)', () => {
      // The pattern excludes !p since p is reserved for penetrate
      expect(explodeSchema.parse('!p')).toEqual({})
    })

    test('returns empty for no match', () => {
      expect(explodeSchema.parse('zzz')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats true as !', () => {
      expect(explodeSchema.toNotation(true)).toBe('!')
    })

    test('returns undefined for false', () => {
      expect(explodeSchema.toNotation(false)).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes true', () => {
      expect(explodeSchema.toDescription(true)).toEqual(['Exploding Dice'])
    })

    test('returns empty for false', () => {
      expect(explodeSchema.toDescription(false)).toEqual([])
    })
  })
})

describe('countSuccessesSchema', () => {
  describe('parse', () => {
    test('parses S{5} (threshold only, desugars to count)', () => {
      expect(countSuccessesSchema.parse('S{5}')).toEqual({
        count: { greaterThanOrEqual: 5 }
      })
    })

    test('parses S{5,2} (threshold and botch, desugars to count)', () => {
      expect(countSuccessesSchema.parse('S{5,2}')).toEqual({
        count: { greaterThanOrEqual: 5, lessThanOrEqual: 2, deduct: true }
      })
    })

    test('returns empty for no match', () => {
      expect(countSuccessesSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats threshold only', () => {
      expect(countSuccessesSchema.toNotation({ greaterThanOrEqual: 5 })).toBe('S{5}')
    })

    test('formats threshold and botch', () => {
      expect(
        countSuccessesSchema.toNotation({
          greaterThanOrEqual: 5,
          lessThanOrEqual: 2,
          deduct: true
        })
      ).toBe('S{5,2}')
    })
  })

  describe('toDescription', () => {
    test('describes threshold only', () => {
      expect(countSuccessesSchema.toDescription({ greaterThanOrEqual: 5 })).toEqual([
        'Count successes >= 5'
      ])
    })

    test('describes threshold and botch', () => {
      expect(
        countSuccessesSchema.toDescription({
          greaterThanOrEqual: 5,
          lessThanOrEqual: 2,
          deduct: true
        })
      ).toEqual(['Count successes >= 5, botches <= 2'])
    })
  })
})

describe('multiplySchema', () => {
  describe('parse', () => {
    test('parses *3', () => {
      expect(multiplySchema.parse('*3')).toEqual({ multiply: 3 })
    })

    test('does not match **3 (multiplyTotal)', () => {
      expect(multiplySchema.parse('**3')).toEqual({})
    })

    test('returns empty for no match', () => {
      expect(multiplySchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats multiplier', () => {
      expect(multiplySchema.toNotation(3)).toBe('*3')
    })
  })

  describe('toDescription', () => {
    test('describes multiplier', () => {
      expect(multiplySchema.toDescription(3)).toEqual(['Multiply dice by 3'])
    })
  })
})

describe('multiplyTotalSchema', () => {
  describe('parse', () => {
    test('parses **3', () => {
      expect(multiplyTotalSchema.parse('**3')).toEqual({
        multiplyTotal: 3
      })
    })

    test('returns empty for no match', () => {
      expect(multiplyTotalSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats total multiplier', () => {
      expect(multiplyTotalSchema.toNotation(3)).toBe('**3')
    })
  })

  describe('toDescription', () => {
    test('describes total multiplier', () => {
      expect(multiplyTotalSchema.toDescription(3)).toEqual(['Multiply total by 3'])
    })
  })
})

describe('plusSchema', () => {
  describe('parse', () => {
    test('parses +5', () => {
      expect(plusSchema.parse('+5')).toEqual({ plus: 5 })
    })

    test('parses +3+2 (accumulates)', () => {
      expect(plusSchema.parse('+3+2')).toEqual({ plus: 5 })
    })

    test('returns empty for no match', () => {
      expect(plusSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats positive', () => {
      expect(plusSchema.toNotation(5)).toBe('+5')
    })

    test('handles negative (converts to minus notation)', () => {
      expect(plusSchema.toNotation(-3)).toBe('-3')
    })
  })

  describe('toDescription', () => {
    test('describes addition', () => {
      expect(plusSchema.toDescription(5)).toEqual(['Add 5'])
    })
  })
})

describe('minusSchema', () => {
  describe('parse', () => {
    test('parses -3', () => {
      expect(minusSchema.parse('-3')).toEqual({ minus: 3 })
    })

    test('parses -2-1 (accumulates)', () => {
      expect(minusSchema.parse('-2-1')).toEqual({ minus: 3 })
    })

    test('returns empty for no match', () => {
      expect(minusSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats subtraction', () => {
      expect(minusSchema.toNotation(3)).toBe('-3')
    })
  })

  describe('toDescription', () => {
    test('describes subtraction', () => {
      expect(minusSchema.toDescription(3)).toEqual(['Subtract 3'])
    })
  })
})
