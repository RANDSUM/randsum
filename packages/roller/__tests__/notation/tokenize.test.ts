import { describe, expect, test } from 'bun:test'
import { tokenize } from '../../src/notation/tokenize'

describe('tokenize', () => {
  test('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  test('tokenizes basic notation as core', () => {
    const tokens = tokenize('2d6')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.category).toBe('Core')
    expect(tokens[0]?.text).toBe('2d6')
    expect(tokens[0]?.start).toBe(0)
    expect(tokens[0]?.end).toBe(3)
  })

  test('tokenizes drop lowest', () => {
    const tokens = tokenize('4d6L')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.category).toBe('Core')
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('L')
  })

  test('tokenizes drop highest', () => {
    const tokens = tokenize('2d20H')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('H')
  })

  test('tokenizes explode', () => {
    const tokens = tokenize('3d6!')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Explode')
    expect(tokens[1]?.text).toBe('!')
  })

  test('tokenizes compound', () => {
    const tokens = tokenize('3d6!!')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Explode')
    expect(tokens[1]?.text).toBe('!!')
  })

  test('tokenizes penetrate', () => {
    const tokens = tokenize('3d6!p')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Explode')
    expect(tokens[1]?.text).toBe('!p')
  })

  test('tokenizes plus modifier', () => {
    const tokens = tokenize('1d20+5')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Arithmetic')
    expect(tokens[1]?.text).toBe('+5')
  })

  test('tokenizes minus modifier', () => {
    const tokens = tokenize('2d8-2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Arithmetic')
    expect(tokens[1]?.text).toBe('-2')
  })

  test('tokenizes reroll', () => {
    const tokens = tokenize('4d6R{1}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('R{1}')
  })

  test('tokenizes cap', () => {
    const tokens = tokenize('4d20C{>18}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('C{>18}')
  })

  test('tokenizes replace', () => {
    const tokens = tokenize('3d6V{1=6}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('V{1=6}')
  })

  test('tokenizes unique', () => {
    const tokens = tokenize('5d20U')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('U')
  })

  test('tokenizes keep highest', () => {
    const tokens = tokenize('4d6K3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('K3')
  })

  test('tokenizes keep lowest', () => {
    const tokens = tokenize('4d6kl2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('kl2')
  })

  test('tokenizes multiply', () => {
    const tokens = tokenize('2d6*3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Arithmetic')
    expect(tokens[1]?.text).toBe('*3')
  })

  test('tokenizes multiplyTotal', () => {
    const tokens = tokenize('2d6**3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Arithmetic')
    expect(tokens[1]?.text).toBe('**3')
  })

  test('tokenizes countSuccesses', () => {
    const tokens = tokenize('4d6S{5}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Counting')
    expect(tokens[1]?.text).toBe('S{5}')
  })

  test('tokenizes multiple modifiers', () => {
    const tokens = tokenize('4d6LR{1}!+3')
    expect(tokens.length).toBeGreaterThanOrEqual(4)
    const types = tokens.map(t => t.category)
    expect(types).toContain('Core')
    expect(types).toContain('Pool')
    expect(types).toContain('Pool')
    expect(types).toContain('Explode')
    expect(types).toContain('Arithmetic')
  })

  test('handles unknown characters', () => {
    const tokens = tokenize('2d6@')
    const unknownToken = tokens.find(t => t.category === 'unknown')
    expect(unknownToken).toBeDefined()
    expect(unknownToken?.text).toBe('@')
  })

  test('merges consecutive unknown characters', () => {
    const tokens = tokenize('2d6@@')
    const unknownTokens = tokens.filter(t => t.category === 'unknown')
    expect(unknownTokens).toHaveLength(1)
    expect(unknownTokens[0]?.text).toBe('@@')
  })

  test('tokenizes multi-dice notation with + prefix', () => {
    const tokens = tokenize('1d20+2d6')
    const coreTokens = tokens.filter(t => t.category === 'Core')
    expect(coreTokens).toHaveLength(2)
  })

  test('tokenizes multi-dice notation with - prefix', () => {
    const tokens = tokenize('1d20-1d4')
    const coreTokens = tokens.filter(t => t.category === 'Core')
    expect(coreTokens).toHaveLength(2)
  })

  test('includes description for core token', () => {
    const tokens = tokenize('2d6')
    expect(tokens[0]?.description).toContain('Roll 2 6-sided dice')
  })

  test('includes description for modifier tokens', () => {
    const tokens = tokenize('4d6L')
    const dropToken = tokens.find(t => t.category === 'Pool')
    expect(dropToken?.description).toBeTruthy()
  })

  test('describes core token with fallback when notation is invalid', () => {
    // 1d0 matches the core regex but isDiceNotation returns false (0 sides),
    // so describeCoreToken falls back to parsing qty/sides from the text directly
    const tokens = tokenize('1d0')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.category).toBe('Core')
    expect(tokens[0]?.description).toBe('Roll 1 0-sided die')
  })

  test('describes core token fallback with plural dice', () => {
    const tokens = tokenize('3d0')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.category).toBe('Core')
    expect(tokens[0]?.description).toBe('Roll 3 0-sided dice')
  })

  test('handles no core match at start', () => {
    const tokens = tokenize('L')
    expect(tokens.length).toBeGreaterThanOrEqual(1)
  })

  test('tokenizes compound with depth', () => {
    const tokens = tokenize('2d6!!3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Explode')
    expect(tokens[1]?.text).toBe('!!3')
  })

  test('tokenizes penetrate with depth', () => {
    const tokens = tokenize('2d6!p3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Explode')
    expect(tokens[1]?.text).toBe('!p3')
  })

  test('tokenizes drop with count', () => {
    const tokens = tokenize('5d6L2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('L2')
  })

  test('tokenizes unique with exceptions', () => {
    const tokens = tokenize('5d6U{1,6}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.category).toBe('Pool')
    expect(tokens[1]?.text).toBe('U{1,6}')
  })

  // ── Special Die Type Tokens ────────────────────────────────────────────

  describe('special die type tokens', () => {
    test('tokenizes d% as percentile', () => {
      const tokens = tokenize('d%')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes D% as percentile (case-insensitive)', () => {
      const tokens = tokenize('D%')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes dF as fate', () => {
      const tokens = tokenize('dF')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes 4dF as fate', () => {
      const tokens = tokenize('4dF')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes dF.2 as fate', () => {
      const tokens = tokenize('dF.2')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes df as fate (case-insensitive)', () => {
      const tokens = tokenize('df')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes z6 as zeroBias', () => {
      const tokens = tokenize('z6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes 3z10 as zeroBias', () => {
      const tokens = tokenize('3z10')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes Z6 as zeroBias (case-insensitive)', () => {
      const tokens = tokenize('Z6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes g6 as geometric', () => {
      const tokens = tokenize('g6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes 3g6 as geometric', () => {
      const tokens = tokenize('3g6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes G6 as geometric (case-insensitive)', () => {
      const tokens = tokenize('G6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes DD6 as draw', () => {
      const tokens = tokenize('DD6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes 3DD6 as draw', () => {
      const tokens = tokenize('3DD6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes dd6 as draw (case-insensitive)', () => {
      const tokens = tokenize('dd6')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes d{2,3,5,7} as customFaces', () => {
      const tokens = tokenize('d{2,3,5,7}')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes d{fire,ice} as customFaces', () => {
      const tokens = tokenize('d{fire,ice}')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('tokenizes 3d{1,1,2} as customFaces', () => {
      const tokens = tokenize('3d{1,1,2}')
      expect(tokens[0]?.category).toBe('Special')
    })

    test('percentile token has correct description', () => {
      const tokens = tokenize('d%')
      expect(tokens[0]?.description).toBe('Percentile die (d100)')
    })

    test('fate token has correct description', () => {
      const tokens = tokenize('4dF')
      expect(tokens[0]?.description).toBe('Fate die: 4dF')
    })

    test('draw token has correct description', () => {
      const tokens = tokenize('DD6')
      expect(tokens[0]?.description).toBe('Draw die: DD6')
    })

    test('geometric token has correct description', () => {
      const tokens = tokenize('g6')
      expect(tokens[0]?.description).toBe('Geometric die: g6')
    })

    test('zeroBias token has correct description', () => {
      const tokens = tokenize('z6')
      expect(tokens[0]?.description).toBe('Zero-bias die: z6')
    })

    test('customFaces token has correct description', () => {
      const tokens = tokenize('d{2,3,5,7}')
      expect(tokens[0]?.description).toBe('Custom faces: d{2,3,5,7}')
    })

    test('special die tokens have correct start/end positions', () => {
      const tokens = tokenize('DD6')
      expect(tokens[0]?.start).toBe(0)
      expect(tokens[0]?.end).toBe(3)
    })

    test('special die tokens have correct text', () => {
      const tokens = tokenize('3DD6')
      expect(tokens[0]?.text).toBe('3DD6')
    })
  })

  // ── Future Feature Tokens ──────────────────────────────────────────────

  describe('explodeSequence tokens', () => {
    test('tokenizes explode sequence with die sizes', () => {
      const tokens = tokenize('2d6!s{4,6,8}')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!s{4,6,8}')
    })

    test('tokenizes inflation explode', () => {
      const tokens = tokenize('2d6!i')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!i')
    })

    test('tokenizes reduction explode', () => {
      const tokens = tokenize('2d6!r')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!r')
    })
  })

  describe('reroll once token', () => {
    test('tokenizes reroll once as reroll type', () => {
      const tokens = tokenize('4d6ro{1}')
      const roToken = tokens.find(t => t.category === 'Pool')
      expect(roToken).toBeDefined()
      expect(roToken?.text).toBe('ro{1}')
    })
  })

  describe('keep middle token', () => {
    test('tokenizes keep middle', () => {
      const tokens = tokenize('6d6KM')
      const kmToken = tokens.find(t => t.category === 'Pool')
      expect(kmToken).toBeDefined()
      expect(kmToken?.text).toBe('KM')
    })
  })

  describe('margin of success token', () => {
    test('tokenizes margin of success', () => {
      const tokens = tokenize('1d20ms{15}')
      const msToken = tokens.find(t => t.category === 'Counting')
      expect(msToken).toBeDefined()
      expect(msToken?.text).toBe('ms{15}')
    })
  })

  // ── Missing Notation Coverage ────────────────────────────────────────

  describe('missing notation coverage', () => {
    test('tokenizes F{3} as countFailures', () => {
      const tokens = tokenize('5d10F{3}')
      const fToken = tokens.find(t => t.category === 'Counting')
      expect(fToken).toBeDefined()
      expect(fToken?.text).toBe('F{3}')
      expect(fToken?.category).not.toBe('unknown')
    })

    test('tokenizes lowercase f{5} as countFailures', () => {
      const tokens = tokenize('5d10f{5}')
      const fToken = tokens.find(t => t.category === 'Counting')
      expect(fToken).toBeDefined()
      expect(fToken?.text).toBe('f{5}')
    })

    test('tokenizes #{>=7} as count', () => {
      const tokens = tokenize('5d10#{>=7}')
      const countToken = tokens.find(t => t.category === 'Counting')
      expect(countToken).toBeDefined()
      expect(countToken?.text).toBe('#{>=7}')
    })

    test('tokenizes KM as keepMiddle', () => {
      const tokens = tokenize('6d6KM')
      const kmToken = tokens.find(t => t.category === 'Pool')
      expect(kmToken).toBeDefined()
      expect(kmToken?.text).toBe('KM')
    })

    test('tokenizes KM3 as keepMiddle', () => {
      const tokens = tokenize('6d6KM3')
      const kmToken = tokens.find(t => t.category === 'Pool')
      expect(kmToken).toBeDefined()
      expect(kmToken?.text).toBe('KM3')
    })

    test('tokenizes ro{1} as reroll', () => {
      const tokens = tokenize('4d6ro{1}')
      const roToken = tokens.find(t => t.category === 'Pool')
      expect(roToken).toBeDefined()
      expect(roToken?.text).toBe('ro{1}')
    })

    test('tokenizes !s{4,6,8} as explodeSequence', () => {
      const tokens = tokenize('2d6!s{4,6,8}')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!s{4,6,8}')
    })

    test('tokenizes !i as explodeSequence', () => {
      const tokens = tokenize('2d6!i')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!i')
    })

    test('tokenizes !r as explodeSequence', () => {
      const tokens = tokenize('2d6!r')
      const esToken = tokens.find(t => t.category === 'Explode')
      expect(esToken).toBeDefined()
      expect(esToken?.text).toBe('!r')
    })

    test('tokenizes ms{15} as marginOfSuccess', () => {
      const tokens = tokenize('1d20ms{15}')
      const msToken = tokens.find(t => t.category === 'Counting')
      expect(msToken).toBeDefined()
      expect(msToken?.text).toBe('ms{15}')
    })

    test('tokenizes W as wildDie', () => {
      const tokens = tokenize('5d6W')
      const wToken = tokens.find(t => t.category === 'Special')
      expect(wToken).toBeDefined()
      expect(wToken?.text).toBe('W')
    })
  })
})
