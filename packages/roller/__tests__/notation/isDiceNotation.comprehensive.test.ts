import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'

describe('isDiceNotation — comprehensive', () => {
  describe('core dice', () => {
    test.each([
      ['1d6'],
      ['4d6'],
      ['1d20'],
      ['100d100'],
      ['1D6'],
      ['4D20'],
      ['999d999'],
      ['1000000d1000000']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('drop modifiers', () => {
    test.each([
      ['4d6L'],
      ['4d6l'],
      ['4d6L2'],
      ['4d6H'],
      ['4d6h'],
      ['4d6H2'],
      ['4d6D{<2}'],
      ['4d6D{>5}'],
      ['4d6D{2,4}'],
      ['4d6D{<2,>5,2,4}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('keep modifiers', () => {
    test.each([
      ['4d6K'],
      ['4d6K2'],
      ['4d6k'],
      ['4d6k3'],
      ['4d6KL'],
      ['4d6KL2'],
      ['4d6kl'],
      ['4d6kl3'],
      ['4d6KM'],
      ['4d6KM2'],
      ['4d6km']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('explode family', () => {
    test.each([
      ['1d6!'],
      ['1d6!!'],
      ['1d6!p'],
      // BUG: !P should be valid (penetrate pattern has /i flag, but buildNotationPattern
      // joins .source strings which loses the flag). Asserting correct expected behavior.
      // ['1d6!P'],
      ['1d6!{>5}'],
      ['1d6!!{>5}'],
      ['1d6!p{>5}'],
      ['1d6!i'],
      ['1d6!I'],
      ['1d6!r'],
      ['1d6!R'],
      ['1d6!s{2,4}'],
      ['1d6!S{2,4}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })

    test('isDiceNotation("1d6!P") returns true', () => {
      expect(isDiceNotation('1d6!P')).toBe(true)
    })
  })

  describe('reroll modifiers', () => {
    test.each([
      ['1d6R{<3}'],
      ['1d6R{>5}'],
      ['1d6R{2}'],
      ['1d6r{<3}'],
      ['1d6R{<3}5'],
      ['1d6ro{1,2}'],
      ['1d6Ro{1,2}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('cap/clamp modifiers', () => {
    test.each([
      ['1d20C{<1,>6}'],
      ['1d20C{>10}'],
      ['1d20C{<1}'],
      ['1d20c{<1,>6}'],
      ['1d20C{>=4}'],
      ['1d20C{<=2}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('replace/map modifiers', () => {
    test.each([['1d6V{1=6}'], ['1d6V{>5=1}'], ['1d6v{1=6}'], ['1d6V{1=2,2=3}']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )

    // V{=1:6} uses colon syntax which is not supported — replace uses = as separator
    test('isDiceNotation("1d6V{=1:6}") returns false (colon not valid replace syntax)', () => {
      expect(isDiceNotation('1d6V{=1:6}')).toBe(false)
    })
  })

  describe('unique modifiers', () => {
    test.each([['4d6U'], ['4d6u'], ['4d6U{3,6}'], ['4d6u{3,6}']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('count modifiers', () => {
    test.each([['4d6#{>=3}'], ['4d6#{>3}'], ['4d6S{3}'], ['4d6S{3,4}'], ['4d6F{1}']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('arithmetic modifiers', () => {
    test.each([
      ['1d20+5'],
      ['1d20-3'],
      ['4d6+10'],
      ['1d20-1'],
      ['4d6*2'],
      ['4d6**3'],
      ['4d6//2'],
      ['4d6%10'],
      ['1d20ms{7}'],
      ['1d20MS{10}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('sort modifiers', () => {
    test.each([['4d6sa'], ['4d6SA'], ['4d6sd'], ['4d6SD']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )

    // Bare s/S is intentionally not valid sort notation per spec — must use sa/sd
    test.each([['4d6s'], ['4d6S']])(
      'isDiceNotation("%s") returns false (bare sort requires direction suffix)',
      notation => {
        expect(isDiceNotation(notation)).toBe(false)
      }
    )
  })

  describe('wild die', () => {
    test.each([['5d6W'], ['5d6w']])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('repeat operator', () => {
    test.each([['4d6Lx6'], ['4d6x3'], ['1d20X2']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('label/annotation', () => {
    test.each([['1d20+5[fire]'], ['4d6L[ability score]'], ['1d6[damage]']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('percentile dice', () => {
    test.each([['d%'], ['D%'], ['1d%'], ['3d%']])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('fate/fudge dice', () => {
    test.each([['dF'], ['DF'], ['df'], ['4dF'], ['dF.1'], ['dF.2'], ['4dF.2']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('zero-bias dice', () => {
    test.each([['z6'], ['Z6'], ['3z6'], ['z10']])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('custom faces dice', () => {
    test.each([
      ['d{H,T}'],
      ['d{1,2,3}'],
      ['d{fire,ice,lightning}'],
      ['3d{1,1,2,2,3,3}'],
      ['D{H,T}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('draw dice', () => {
    test.each([['DD6'], ['dd20'], ['Dd8'], ['dD10'], ['3DD8']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('geometric dice', () => {
    test.each([['g6'], ['G6'], ['2g6'], ['g10']])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('multi-pool', () => {
    test.each([
      ['1d20+1d6'],
      ['4d6L+2d8'],
      ['1d20+2d6-1d8'],
      ['1d20-1d6'],
      ['1d20+1d%'],
      ['1d20+d%'],
      ['1d%+1d20'],
      ['3d%+2d6'],
      ['1d20+g6'],
      ['4d6L+3DD8'],
      ['1d20+z6'],
      ['1d20+dF'],
      ['2dF+2dF'],
      ['4dF.2+1d20'],
      ['1d20+d{H,T}'],
      ['d{H,T}+d{A,B,C}']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('combined modifiers', () => {
    test.each([
      ['4d6L+5'],
      ['4d6L!+5'],
      ['4d6KH3!!'],
      ['4d6K3!!'],
      ['4d6L+5[ability score]'],
      ['1d20+5[attack roll]'],
      ['4d6Lx6'],
      ['4d6R{<2}!'],
      ['4d6LR{1}+3']
    ])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })

    // !R is parsed as explode-reverse (explodeSequence), not explode+reroll
    // So 4d6!R{<2} leaves {<2} as unmatched junk — correctly invalid
    test('isDiceNotation("4d6!R{<2}") returns false (!R is explode-reverse, not explode+reroll)', () => {
      expect(isDiceNotation('4d6!R{<2}')).toBe(false)
    })
  })

  describe('special die types with modifiers', () => {
    test.each([['3z10L'], ['g6+3'], ['3DD6H'], ['z6!'], ['2g6+5'], ['DD6K']])(
      'isDiceNotation("%s") returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('stress tests', () => {
    test('long multi-pool notation is valid', () => {
      expect(isDiceNotation('1d20+dF+dF+dF+dF+dF+dF+dF+dF+dF+dF')).toBe(true)
    })

    test('notation over 1000 chars is rejected', () => {
      expect(isDiceNotation('1d6' + 'L'.repeat(999))).toBe(false)
    })

    test('exactly 1000 char notation is accepted if valid', () => {
      // 1d6 = 3 chars + L repeated 997 times = 1000 chars total
      // Each L is valid (drop lowest), so this should parse
      const notation = '1d6' + 'L'.repeat(997)
      expect(notation.length).toBe(1000)
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('invalid — non-string types', () => {
    test.each([
      [null, 'null'],
      [undefined, 'undefined'],
      [42, 'number'],
      [0, 'zero'],
      [-1, 'negative number'],
      [true, 'boolean true'],
      [false, 'boolean false'],
      [{}, 'empty object'],
      [{ sides: 6 }, 'options object'],
      [[], 'empty array'],
      [['1d6'], 'array with notation']
    ])('isDiceNotation(%s) returns false (%s)', value => {
      expect(isDiceNotation(value)).toBe(false)
    })
  })

  describe('invalid — empty and whitespace', () => {
    test.each([[''], ['   '], ['\t'], ['\n']])('isDiceNotation(%j) returns false', value => {
      expect(isDiceNotation(value)).toBe(false)
    })
  })

  describe('invalid — non-dice strings', () => {
    test.each([
      ['not-dice'],
      ['hello'],
      ['abc'],
      ['123'],
      ['roll 1d6'],
      ['1d6 damage'],
      ['prefix1d6'],
      ['1d6suffix']
    ])('isDiceNotation("%s") returns false', notation => {
      expect(isDiceNotation(notation)).toBe(false)
    })
  })

  describe('invalid — incomplete notation', () => {
    test.each([['d'], ['4d'], ['d6'], ['d0'], ['1d0'], ['0d6']])(
      'isDiceNotation("%s") returns false',
      notation => {
        expect(isDiceNotation(notation)).toBe(false)
      }
    )
  })

  describe('invalid — bad modifiers and characters', () => {
    test.each([['4d6X'], ['4d6X0'], ['1d6@'], ['1d6#'], ['1d6$'], ['1d6%'], ['2d6d'], ['1d}']])(
      'isDiceNotation("%s") returns false',
      notation => {
        expect(isDiceNotation(notation)).toBe(false)
      }
    )
  })

  describe('invalid — whitespace within notation', () => {
    test.each([['2d8 + 3'], ['4d6L + 2'], ['3d6 ! + 5']])(
      'isDiceNotation("%s") returns false',
      notation => {
        expect(isDiceNotation(notation)).toBe(false)
      }
    )
  })

  describe('invalid — decimal numbers', () => {
    test.each([['1.5d6'], ['2d6.5']])('isDiceNotation("%s") returns false', notation => {
      expect(isDiceNotation(notation)).toBe(false)
    })
  })

  describe('valid — leading/trailing whitespace is trimmed', () => {
    test.each([[' 1d6'], ['1d6 '], [' 1d6 '], ['\t2d8\t'], ['\n4d6\n']])(
      'isDiceNotation(%j) returns true',
      notation => {
        expect(isDiceNotation(notation)).toBe(true)
      }
    )
  })

  describe('valid — signed leading pool', () => {
    test.each([['+1d6'], ['-1d6']])('isDiceNotation("%s") returns true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
    })
  })

  describe('double drop is valid (additive)', () => {
    test('isDiceNotation("4d6LL") returns true', () => {
      expect(isDiceNotation('4d6LL')).toBe(true)
    })
  })

  describe('invalid — V{=2} is not valid replace syntax', () => {
    test('isDiceNotation("1d20+V{=2}") returns false', () => {
      expect(isDiceNotation('1d20+V{=2}')).toBe(false)
    })
  })
})
