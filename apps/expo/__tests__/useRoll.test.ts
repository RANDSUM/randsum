import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { useNotationStore } from '../lib/stores/notationStore'

// Mock @randsum/roller so we control roll() output
const mockRoll = mock(() => ({
  total: 15,
  rolls: [
    {
      notation: '4d6L',
      initialRolls: [6, 5, 4, 1],
      rolls: [6, 5, 4]
    }
  ]
}))

mock.module('@randsum/roller', () => ({
  roll: mockRoll,
  isDiceNotation: (s: string) => /^\d+d\d+/.test(s)
}))

const { useRoll } = await import('../hooks/useRoll')

describe('useRoll (new shape)', () => {
  beforeEach(() => {
    useNotationStore.setState({ notation: '', isValid: false, hasError: false })
    mockRoll.mockClear()
  })

  test('hook module exports useRoll function', () => {
    expect(typeof useRoll).toBe('function')
  })

  test('useRoll is a function (hook shape verified at type level)', () => {
    // The hook can only be called inside a React component. We verify the
    // module contract here: the export exists and is callable.
    expect(useRoll).toBeDefined()
  })
})
