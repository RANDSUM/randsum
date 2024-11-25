import { describe, expect, it } from 'bun:test'
import { isDiceNotation } from '../src/guards'

describe('guards', () => {
  describe('isDiceNotation', () => {
    describe('given valid dice notation', () => {
      it('returns true', () => {
        expect(isDiceNotation('1d20')).toBe(true)
        expect(isDiceNotation('2d20H+5')).toBe(true)
        expect(isDiceNotation('200d20HL5V{1=20}R{>10}2U{1,2,3}+2-5')).toBe(true)
      })
    })

    describe('given invalid dice notation', () => {
      it('returns false', () => {
        expect(isDiceNotation('1xd20')).toBe(false)
        expect(isDiceNotation('2d20P+5')).toBe(false)
        expect(isDiceNotation('DefinitelyNot')).toBe(false)
      })
    })
  })
})
