// apps/app/__tests__/lib/storage.test.ts
import { describe, test, expect } from 'bun:test'

// Mock AsyncStorage with an in-memory store
const store: Record<string, string> = {}
import { mock } from 'bun:test'
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => store[key] ?? null,
    setItem: async (key: string, value: string) => { store[key] = value },
  },
}))

const { loadHistory, saveHistory, loadSavedRolls, saveSavedRolls } =
  await import('../../src/lib/storage')

import type { HistoryEntry, SavedRoll } from '../../src/types'

const sampleEntry: HistoryEntry = {
  id: 'test-1',
  notation: '1d6',
  description: 'Roll 1 6-sided die',
  total: 4,
  groups: [{
    notation: '1d6',
    initialRolls: [4],
    modifiedRolls: [4],
    droppedIndices: [],
    groupTotal: 4,
  }],
  timestamp: 1000,
}

const sampleSaved: SavedRoll = {
  id: 'saved-1',
  name: 'Quick Roll',
  notation: '1d20',
}

describe('storage', () => {
  describe('history', () => {
    test('loadHistory returns [] when empty', async () => {
      expect(await loadHistory()).toEqual([])
    })
    test('saveHistory and loadHistory round-trip', async () => {
      await saveHistory([sampleEntry])
      expect(await loadHistory()).toEqual([sampleEntry])
    })
  })
  describe('savedRolls', () => {
    test('loadSavedRolls returns [] when empty', async () => {
      expect(await loadSavedRolls()).toEqual([])
    })
    test('saveSavedRolls and loadSavedRolls round-trip', async () => {
      await saveSavedRolls([sampleSaved])
      expect(await loadSavedRolls()).toEqual([sampleSaved])
    })
  })
})
