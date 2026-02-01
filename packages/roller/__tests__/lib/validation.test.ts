import { describe, expect, test } from 'bun:test'
import {
  validateFinite,
  validateGreaterThan,
  validateInteger,
  validateLessThan,
  validateNonNegative,
  validateRange
} from '../../src/lib/utils/validation'

describe('validateInteger', () => {
  test('passes for positive integers', () => {
    expect(() => {
      validateInteger(5, 'count')
    }).not.toThrow()
  })

  test('passes for zero', () => {
    expect(() => {
      validateInteger(0, 'count')
    }).not.toThrow()
  })

  test('passes for negative integers', () => {
    expect(() => {
      validateInteger(-10, 'count')
    }).not.toThrow()
  })

  test('throws for decimal numbers', () => {
    expect(() => {
      validateInteger(5.5, 'count')
    }).toThrow('count must be an integer')
  })

  test('throws for small decimals', () => {
    expect(() => {
      validateInteger(1.001, 'value')
    }).toThrow('value must be an integer')
  })

  test('error includes the received value', () => {
    expect(() => {
      validateInteger(3.14, 'pi')
    }).toThrow('received: 3.14')
  })
})

describe('validateRange', () => {
  test('passes for value within range', () => {
    expect(() => {
      validateRange(5, 1, 10, 'bonus')
    }).not.toThrow()
  })

  test('passes for value at minimum', () => {
    expect(() => {
      validateRange(1, 1, 10, 'bonus')
    }).not.toThrow()
  })

  test('passes for value at maximum', () => {
    expect(() => {
      validateRange(10, 1, 10, 'bonus')
    }).not.toThrow()
  })

  test('throws for value below minimum', () => {
    expect(() => {
      validateRange(0, 1, 10, 'bonus')
    }).toThrow('bonus must be between 1 and 10')
  })

  test('throws for value above maximum', () => {
    expect(() => {
      validateRange(15, 1, 10, 'bonus')
    }).toThrow('bonus must be between 1 and 10')
  })

  test('error includes the received value', () => {
    expect(() => {
      validateRange(100, 1, 10, 'level')
    }).toThrow('received: 100')
  })

  test('works with negative ranges', () => {
    expect(() => {
      validateRange(-5, -10, -1, 'modifier')
    }).not.toThrow()
    expect(() => {
      validateRange(0, -10, -1, 'modifier')
    }).toThrow()
  })
})

describe('validateNonNegative', () => {
  test('passes for positive values', () => {
    expect(() => {
      validateNonNegative(5, 'count')
    }).not.toThrow()
  })

  test('passes for zero', () => {
    expect(() => {
      validateNonNegative(0, 'count')
    }).not.toThrow()
  })

  test('throws for negative values', () => {
    expect(() => {
      validateNonNegative(-1, 'count')
    }).toThrow('count must be non-negative')
  })

  test('throws for large negative values', () => {
    expect(() => {
      validateNonNegative(-100, 'amount')
    }).toThrow('amount must be non-negative')
  })

  test('error includes the received value', () => {
    expect(() => {
      validateNonNegative(-5, 'total')
    }).toThrow('received: -5')
  })
})

describe('validateFinite', () => {
  test('passes for regular numbers', () => {
    expect(() => {
      validateFinite(42, 'bonus')
    }).not.toThrow()
  })

  test('passes for zero', () => {
    expect(() => {
      validateFinite(0, 'bonus')
    }).not.toThrow()
  })

  test('passes for negative numbers', () => {
    expect(() => {
      validateFinite(-100, 'penalty')
    }).not.toThrow()
  })

  test('passes for decimals', () => {
    expect(() => {
      validateFinite(3.14159, 'pi')
    }).not.toThrow()
  })

  test('throws for positive Infinity', () => {
    expect(() => {
      validateFinite(Infinity, 'bonus')
    }).toThrow('bonus must be a finite number')
  })

  test('throws for negative Infinity', () => {
    expect(() => {
      validateFinite(-Infinity, 'penalty')
    }).toThrow('penalty must be a finite number')
  })

  test('throws for NaN', () => {
    expect(() => {
      validateFinite(NaN, 'value')
    }).toThrow('value must be a finite number')
  })

  test('error includes the received value', () => {
    expect(() => {
      validateFinite(Infinity, 'max')
    }).toThrow('received: Infinity')
  })
})

describe('validateGreaterThan', () => {
  test('passes for value greater than threshold', () => {
    expect(() => {
      validateGreaterThan(10, 5, 'count')
    }).not.toThrow()
  })

  test('throws for value equal to threshold', () => {
    expect(() => {
      validateGreaterThan(5, 5, 'count')
    }).toThrow('count must be greater than 5')
  })

  test('throws for value less than threshold', () => {
    expect(() => {
      validateGreaterThan(3, 5, 'count')
    }).toThrow('count must be greater than 5')
  })

  test('works with zero threshold', () => {
    expect(() => {
      validateGreaterThan(1, 0, 'positive')
    }).not.toThrow()
    expect(() => {
      validateGreaterThan(0, 0, 'positive')
    }).toThrow()
  })

  test('works with negative threshold', () => {
    expect(() => {
      validateGreaterThan(0, -5, 'value')
    }).not.toThrow()
    expect(() => {
      validateGreaterThan(-5, -5, 'value')
    }).toThrow()
  })

  test('error includes received value', () => {
    expect(() => {
      validateGreaterThan(2, 5, 'num')
    }).toThrow('received: 2')
  })
})

describe('validateLessThan', () => {
  test('passes for value less than threshold', () => {
    expect(() => {
      validateLessThan(3, 5, 'count')
    }).not.toThrow()
  })

  test('throws for value equal to threshold', () => {
    expect(() => {
      validateLessThan(5, 5, 'count')
    }).toThrow('count must be less than 5')
  })

  test('throws for value greater than threshold', () => {
    expect(() => {
      validateLessThan(10, 5, 'count')
    }).toThrow('count must be less than 5')
  })

  test('works with zero threshold', () => {
    expect(() => {
      validateLessThan(-1, 0, 'negative')
    }).not.toThrow()
    expect(() => {
      validateLessThan(0, 0, 'negative')
    }).toThrow()
  })

  test('works with negative threshold', () => {
    expect(() => {
      validateLessThan(-10, -5, 'value')
    }).not.toThrow()
    expect(() => {
      validateLessThan(-5, -5, 'value')
    }).toThrow()
  })

  test('error includes received value', () => {
    expect(() => {
      validateLessThan(10, 5, 'max')
    }).toThrow('received: 10')
  })
})
