import { describe, expect, test } from 'bun:test'

import { mergeHistoryEntries, mergeTemplates } from '../lib/sync'
import type { RollHistoryEntry, RollTemplate } from '../lib/types'

function makeTemplate(overrides: Partial<RollTemplate> & { id: string }): RollTemplate {
  return {
    name: 'Test Template',
    notation: '2d6',
    variables: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

function makeHistoryEntry(overrides: Partial<RollHistoryEntry> & { id: string }): RollHistoryEntry {
  return {
    notation: '1d20',
    total: 15,
    rolls: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('mergeHistoryEntries', () => {
  test('empty local, non-empty cloud returns cloud entries', () => {
    const e1 = makeHistoryEntry({ id: 'a' })
    const result = mergeHistoryEntries([], [e1])
    expect(result).toEqual([e1])
  })

  test('non-empty local, empty cloud returns local entries', () => {
    const e1 = makeHistoryEntry({ id: 'a' })
    const result = mergeHistoryEntries([e1], [])
    expect(result).toEqual([e1])
  })

  test('disjoint sets produce union', () => {
    const e1 = makeHistoryEntry({ id: 'a', createdAt: '2026-01-02T00:00:00.000Z' })
    const e2 = makeHistoryEntry({ id: 'b', createdAt: '2026-01-01T00:00:00.000Z' })
    const result = mergeHistoryEntries([e1], [e2])
    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe('a')
    expect(result[1]!.id).toBe('b')
  })

  test('same id, cloud has newer createdAt — cloud wins', () => {
    const local = makeHistoryEntry({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z', total: 10 })
    const cloud = makeHistoryEntry({ id: 'a', createdAt: '2026-01-02T00:00:00.000Z', total: 20 })
    const result = mergeHistoryEntries([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.total).toBe(20)
  })

  test('same id, local has newer createdAt — local wins', () => {
    const local = makeHistoryEntry({ id: 'a', createdAt: '2026-01-02T00:00:00.000Z', total: 10 })
    const cloud = makeHistoryEntry({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z', total: 20 })
    const result = mergeHistoryEntries([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.total).toBe(10)
  })

  test('same id, same createdAt — local wins (first-write)', () => {
    const local = makeHistoryEntry({ id: 'a', total: 10 })
    const cloud = makeHistoryEntry({ id: 'a', total: 20 })
    const result = mergeHistoryEntries([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.total).toBe(10)
  })

  test('results are sorted most-recent-first', () => {
    const e1 = makeHistoryEntry({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z' })
    const e2 = makeHistoryEntry({ id: 'b', createdAt: '2026-01-03T00:00:00.000Z' })
    const e3 = makeHistoryEntry({ id: 'c', createdAt: '2026-01-02T00:00:00.000Z' })
    const result = mergeHistoryEntries([e1, e3], [e2])
    expect(result.map(e => e.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('mergeTemplates', () => {
  test('empty local, non-empty cloud returns cloud templates', () => {
    const t1 = makeTemplate({ id: 'a' })
    const result = mergeTemplates([], [t1])
    expect(result).toEqual([t1])
  })

  test('non-empty local, empty cloud returns local templates', () => {
    const t1 = makeTemplate({ id: 'a' })
    const result = mergeTemplates([t1], [])
    expect(result).toEqual([t1])
  })

  test('disjoint sets produce union', () => {
    const t1 = makeTemplate({ id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' })
    const t2 = makeTemplate({ id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' })
    const result = mergeTemplates([t1], [t2])
    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe('a')
    expect(result[1]!.id).toBe('b')
  })

  test('same id, cloud has newer updatedAt — cloud wins', () => {
    const local = makeTemplate({
      id: 'a',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Old'
    })
    const cloud = makeTemplate({
      id: 'a',
      updatedAt: '2026-01-02T00:00:00.000Z',
      name: 'New'
    })
    const result = mergeTemplates([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('New')
  })

  test('same id, local has newer updatedAt — local wins', () => {
    const local = makeTemplate({
      id: 'a',
      updatedAt: '2026-01-02T00:00:00.000Z',
      name: 'Local'
    })
    const cloud = makeTemplate({
      id: 'a',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Cloud'
    })
    const result = mergeTemplates([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Local')
  })

  test('same id, same updatedAt — local wins (first-write)', () => {
    const local = makeTemplate({ id: 'a', name: 'Local' })
    const cloud = makeTemplate({ id: 'a', name: 'Cloud' })
    const result = mergeTemplates([local], [cloud])
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Local')
  })

  test('results are sorted by updatedAt descending', () => {
    const t1 = makeTemplate({ id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' })
    const t2 = makeTemplate({ id: 'b', updatedAt: '2026-01-03T00:00:00.000Z' })
    const t3 = makeTemplate({ id: 'c', updatedAt: '2026-01-02T00:00:00.000Z' })
    const result = mergeTemplates([t1, t3], [t2])
    expect(result.map(t => t.id)).toEqual(['b', 'c', 'a'])
  })
})
