import { describe, expect, test } from 'bun:test'
import { InvalidUniqueError } from '../../src/utils/invalidUniqueError'

describe('InvalidUniqueError', () => {
  test('creates an error with the correct message', () => {
    const error = new InvalidUniqueError()
    
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(
      'You cannot have unique rolls when there are more rolls than sides of die.'
    )
  })

  test('can be caught as an Error', () => {
    let caughtError: Error | null = null
    
    try {
      throw new InvalidUniqueError()
    } catch (error) {
      caughtError = error as Error
    }
    
    expect(caughtError).toBeInstanceOf(Error)
    expect(caughtError).toBeInstanceOf(InvalidUniqueError)
  })
})
