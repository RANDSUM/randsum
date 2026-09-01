import { describe, expect, test } from 'bun:test'
import { captureException } from '../../src/utils/errorTracker.js'

describe('errorTracker', () => {
  test('capturing never throws, for an Error or anything else', () => {
    expect(() => {
      captureException(new Error('boom'), { command: 'roll' })
    }).not.toThrow()

    expect(() => {
      captureException('plain string failure')
    }).not.toThrow()

    expect(() => {
      captureException(undefined)
    }).not.toThrow()
  })
})
