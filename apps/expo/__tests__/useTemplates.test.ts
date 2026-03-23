import { beforeEach, describe, expect, mock, test } from 'bun:test'

import './setup'

import type { RollTemplate } from '../lib/types'

const mockTemplates: RollTemplate[] = []

mock.module('../lib/storage', () => ({
  storage: {
    getTemplates: async () => [...mockTemplates],
    saveTemplate: async (t: RollTemplate) => {
      mockTemplates.push(t)
    },
    updateTemplate: async (t: RollTemplate) => {
      const idx = mockTemplates.findIndex(x => x.id === t.id)
      if (idx === -1) throw new Error('Not found')
      mockTemplates[idx] = t
    },
    deleteTemplate: async (id: string) => {
      const idx = mockTemplates.findIndex(x => x.id === id)
      if (idx !== -1) mockTemplates.splice(idx, 1)
    }
  }
}))

function makeTemplate(overrides: Partial<RollTemplate> = {}): RollTemplate {
  return {
    id: crypto.randomUUID(),
    name: 'Test Template',
    notation: '1d20',
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

describe('useTemplates (storage integration)', () => {
  beforeEach(() => {
    mockTemplates.length = 0
  })

  test('saveTemplate adds to storage', async () => {
    const { storage } = await import('../lib/storage')
    const template = makeTemplate()
    await storage.saveTemplate(template)
    const loaded = await storage.getTemplates()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]!.id).toBe(template.id)
  })

  test('deleteTemplate removes from storage', async () => {
    const { storage } = await import('../lib/storage')
    const template = makeTemplate()
    await storage.saveTemplate(template)
    await storage.deleteTemplate(template.id)
    const loaded = await storage.getTemplates()
    expect(loaded).toHaveLength(0)
  })

  test('updateTemplate replaces in storage', async () => {
    const { storage } = await import('../lib/storage')
    const template = makeTemplate()
    await storage.saveTemplate(template)
    const updated = { ...template, name: 'Updated Name' }
    await storage.updateTemplate(updated)
    const loaded = await storage.getTemplates()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]!.name).toBe('Updated Name')
  })

  test('updateTemplate throws for nonexistent id', async () => {
    const { storage } = await import('../lib/storage')
    const template = makeTemplate({ id: 'nonexistent' })
    expect(storage.updateTemplate(template)).rejects.toThrow('Not found')
  })
})
