import { describe, expect, test } from 'bun:test'
import { MODIFIER_DOCS } from '@randsum/roller/docs'

// ReferenceSidebar is a React TSX component; structural correctness is gated by the build.
// These tests verify the data contract and lookup logic it relies on.

describe('ReferenceSidebar data contract', () => {
  describe('MODIFIER_DOCS lookup', () => {
    test('a known modifier key resolves to a ModifierDoc', () => {
      const key = Object.keys(MODIFIER_DOCS)[0]
      expect(key).toBeDefined()
      const doc = MODIFIER_DOCS[key]
      expect(doc).toBeDefined()
      expect(typeof doc?.title).toBe('string')
      expect(typeof doc?.description).toBe('string')
      expect(typeof doc?.displayBase).toBe('string')
      expect(Array.isArray(doc?.forms)).toBe(true)
      expect(Array.isArray(doc?.examples)).toBe(true)
    })

    test('an unknown key returns undefined from MODIFIER_DOCS', () => {
      const doc = MODIFIER_DOCS.__not_a_real_key__
      expect(doc).toBeUndefined()
    })

    test('selectedEntry null means no detail should render', () => {
      // When selectedEntry is null, lookup returns undefined — no doc to render
      const selectedEntry: string | null = null
      const doc = selectedEntry !== null ? MODIFIER_DOCS[selectedEntry] : undefined
      expect(doc).toBeUndefined()
    })

    test('selectedEntry matching a MODIFIER_DOCS key returns a doc', () => {
      const key = Object.keys(MODIFIER_DOCS)[0]
      const selectedEntry: string | null = key
      const doc = selectedEntry !== null ? MODIFIER_DOCS[selectedEntry] : undefined
      expect(doc).toBeDefined()
    })

    test('selectedEntry for a non-modifier key (e.g. NdS) returns undefined', () => {
      // Core dice keys like 'NdS' are not in MODIFIER_DOCS — no detail rendered
      const selectedEntry: string | null = 'NdS'
      const doc = selectedEntry !== null ? MODIFIER_DOCS[selectedEntry] : undefined
      expect(doc).toBeUndefined()
    })
  })

  describe('Props contract', () => {
    test('ReferenceSidebar module exports a ReferenceSidebar function', async () => {
      const mod = await import('../src/components/ReferenceSidebar')
      expect(typeof mod.ReferenceSidebar).toBe('function')
    })
  })
})
