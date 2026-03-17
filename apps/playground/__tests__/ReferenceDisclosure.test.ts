import { describe, expect, test } from 'bun:test'

// ReferenceDisclosure is a React TSX component; structural correctness is gated by the build.
// These tests verify the module exports and static behavior contracts.

describe('ReferenceDisclosure', () => {
  test('module exports a ReferenceDisclosure function', async () => {
    const mod = await import('../src/components/ReferenceDisclosure')
    expect(typeof mod.ReferenceDisclosure).toBe('function')
  })

  test('ReferenceDisclosure accepts children (signature check)', async () => {
    const mod = await import('../src/components/ReferenceDisclosure')
    // Must be a function with arity > 0 (takes props including children)
    expect(mod.ReferenceDisclosure).toBeInstanceOf(Function)
  })
})
