import { describe, expect, test } from 'bun:test'
import { formatSides } from '../../src/validateNotation/formatSides'

describe('formatSides', () => {
  describe('basic functionality', () => {
    test('converts string numbers to numbers', () => {
      expect(formatSides('6')).toBe(6)
      expect(formatSides('20')).toBe(20)
      expect(formatSides('100')).toBe(100)
    })

    test('handles single digit numbers', () => {
      expect(formatSides('1')).toBe(1)
      expect(formatSides('2')).toBe(2)
      expect(formatSides('9')).toBe(9)
    })

    test('handles multi-digit numbers', () => {
      expect(formatSides('10')).toBe(10)
      expect(formatSides('12')).toBe(12)
      expect(formatSides('999')).toBe(999)
    })

    test('handles zero', () => {
      expect(formatSides('0')).toBe(0)
    })

    test('handles large numbers', () => {
      expect(formatSides('1000')).toBe(1000)
      expect(formatSides('9999')).toBe(9999)
      expect(formatSides('123456')).toBe(123456)
    })
  })

  describe('edge cases', () => {
    test('handles empty string', () => {
      expect(formatSides('')).toBe(0) // Number('') returns 0
    })

    test('handles whitespace', () => {
      expect(formatSides(' ')).toBe(0) // Number(' ') returns 0
      expect(formatSides('\t')).toBe(0) // Number('\t') returns 0
      expect(formatSides('\n')).toBe(0) // Number('\n') returns 0
    })

    test('handles leading zeros', () => {
      expect(formatSides('06')).toBe(6)
      expect(formatSides('020')).toBe(20)
      expect(formatSides('0100')).toBe(100)
    })

    test('handles negative numbers', () => {
      expect(formatSides('-1')).toBe(-1)
      expect(formatSides('-20')).toBe(-20)
      expect(formatSides('-999')).toBe(-999)
    })

    test('handles decimal numbers', () => {
      expect(formatSides('6.5')).toBe(6.5)
      expect(formatSides('20.25')).toBe(20.25)
      expect(formatSides('0.5')).toBe(0.5)
    })

    test('handles scientific notation', () => {
      expect(formatSides('1e2')).toBe(100)
      expect(formatSides('2.5e1')).toBe(25)
      expect(formatSides('1E3')).toBe(1000)
    })
  })

  describe('invalid input handling', () => {
    test('handles non-numeric strings', () => {
      expect(formatSides('abc')).toBeNaN()
      expect(formatSides('hello')).toBeNaN()
      expect(formatSides('d6')).toBeNaN()
    })

    test('handles mixed alphanumeric strings', () => {
      expect(formatSides('6abc')).toBeNaN()
      expect(formatSides('abc6')).toBeNaN()
      expect(formatSides('1d6')).toBeNaN()
    })

    test('handles special characters', () => {
      expect(formatSides('6!')).toBeNaN()
      expect(formatSides('6+')).toBeNaN()
      expect(formatSides('6-')).toBeNaN()
      expect(formatSides('6*')).toBeNaN()
    })

    test('handles multiple decimal points', () => {
      expect(formatSides('6.5.2')).toBeNaN()
      expect(formatSides('1.2.3.4')).toBeNaN()
    })

    test('handles multiple negative signs', () => {
      expect(formatSides('--6')).toBeNaN()
      expect(formatSides('-+-6')).toBeNaN()
    })
  })

  describe('special numeric values', () => {
    test('handles Infinity', () => {
      expect(formatSides('Infinity')).toBe(Infinity)
      expect(formatSides('-Infinity')).toBe(-Infinity)
    })

    test('handles NaN string', () => {
      expect(formatSides('NaN')).toBeNaN()
    })

    test('handles hexadecimal numbers', () => {
      expect(formatSides('0x10')).toBe(16)
      expect(formatSides('0xFF')).toBe(255)
      expect(formatSides('0x0')).toBe(0)
    })

    test('handles octal numbers', () => {
      expect(formatSides('0o10')).toBe(8)
      expect(formatSides('0O77')).toBe(63)
    })

    test('handles binary numbers', () => {
      expect(formatSides('0b1010')).toBe(10)
      expect(formatSides('0B1111')).toBe(15)
    })
  })

  describe('whitespace handling', () => {
    test('handles leading whitespace', () => {
      expect(formatSides(' 6')).toBe(6)
      expect(formatSides('\t20')).toBe(20)
      expect(formatSides('\n100')).toBe(100)
    })

    test('handles trailing whitespace', () => {
      expect(formatSides('6 ')).toBe(6)
      expect(formatSides('20\t')).toBe(20)
      expect(formatSides('100\n')).toBe(100)
    })

    test('handles surrounding whitespace', () => {
      expect(formatSides(' 6 ')).toBe(6)
      expect(formatSides('\t20\t')).toBe(20)
      expect(formatSides('\n100\n')).toBe(100)
    })

    test('handles internal whitespace', () => {
      expect(formatSides('1 0')).toBeNaN()
      expect(formatSides('2 0')).toBeNaN()
      expect(formatSides('1\t0')).toBeNaN()
    })
  })

  describe('type consistency', () => {
    test('always returns a number type', () => {
      expect(typeof formatSides('6')).toBe('number')
      expect(typeof formatSides('abc')).toBe('number') // NaN is still number type
      expect(typeof formatSides('')).toBe('number')
      expect(typeof formatSides('0')).toBe('number')
    })

    test('returns finite numbers for valid input', () => {
      expect(Number.isFinite(formatSides('6'))).toBe(true)
      expect(Number.isFinite(formatSides('20'))).toBe(true)
      expect(Number.isFinite(formatSides('0'))).toBe(true)
    })

    test('returns NaN for invalid input', () => {
      expect(Number.isNaN(formatSides('abc'))).toBe(true)
      expect(Number.isNaN(formatSides('6abc'))).toBe(true)
      // Note: formatSides('') returns 0, not NaN, due to Number('') === 0
    })
  })

  describe('real-world dice scenarios', () => {
    test('handles common dice sides', () => {
      expect(formatSides('4')).toBe(4) // d4
      expect(formatSides('6')).toBe(6) // d6
      expect(formatSides('8')).toBe(8) // d8
      expect(formatSides('10')).toBe(10) // d10
      expect(formatSides('12')).toBe(12) // d12
      expect(formatSides('20')).toBe(20) // d20
      expect(formatSides('100')).toBe(100) // d100
    })

    test('handles unusual dice sides', () => {
      expect(formatSides('3')).toBe(3) // d3
      expect(formatSides('5')).toBe(5) // d5
      expect(formatSides('7')).toBe(7) // d7
      expect(formatSides('14')).toBe(14) // d14
      expect(formatSides('16')).toBe(16) // d16
      expect(formatSides('30')).toBe(30) // d30
    })

    test('handles edge case dice', () => {
      expect(formatSides('1')).toBe(1) // d1 (always 1)
      expect(formatSides('2')).toBe(2) // d2 (coin flip)
      expect(formatSides('0')).toBe(0) // d0 (edge case)
    })

    test('handles custom dice sides', () => {
      expect(formatSides('13')).toBe(13)
      expect(formatSides('17')).toBe(17)
      expect(formatSides('23')).toBe(23)
      expect(formatSides('37')).toBe(37)
    })
  })

  describe('mathematical properties', () => {
    test('preserves integer values', () => {
      const integers = ['1', '2', '10', '100', '999']
      integers.forEach((int) => {
        const result = formatSides(int)
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBe(parseInt(int, 10))
      })
    })

    test('preserves decimal precision', () => {
      expect(formatSides('6.5')).toBe(6.5)
      expect(formatSides('20.25')).toBe(20.25)
      expect(formatSides('0.125')).toBe(0.125)
    })

    test('handles very large numbers', () => {
      expect(formatSides('999999999')).toBe(999999999)
      expect(formatSides('1000000000')).toBe(1000000000)
    })

    test('handles very small numbers', () => {
      expect(formatSides('0.001')).toBe(0.001)
      expect(formatSides('0.0001')).toBe(0.0001)
    })
  })

  describe('performance characteristics', () => {
    test('performs efficiently with many calls', () => {
      const startTime = performance.now()

      for (let i = 0; i < 10000; i++) {
        formatSides(String(i))
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Should be very fast
    })

    test('handles long numeric strings efficiently', () => {
      const longNumber = '1'.repeat(100) // Very long number string
      const startTime = performance.now()

      const result = formatSides(longNumber)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(10)
      expect(typeof result).toBe('number')
    })
  })
})
