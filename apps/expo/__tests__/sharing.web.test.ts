import { describe, expect, test } from 'bun:test'

// Dynamic import ensures setup.ts preload mock is active before react-native resolves
const { buildNotationUrl, copyLink } = await import('../lib/sharing')

describe('buildNotationUrl', () => {
  test('encodes notation as ?n= query param', () => {
    const url = buildNotationUrl('4d6L')
    expect(url).toContain('?n=')
    expect(url).toContain(encodeURIComponent('4d6L'))
  })

  test('encodes special characters', () => {
    const url = buildNotationUrl('2d6+1d8')
    expect(url).toContain(encodeURIComponent('2d6+1d8'))
  })

  test('encodes complex notation with modifiers', () => {
    const url = buildNotationUrl('4d6L')
    expect(url).toBe(`?n=${encodeURIComponent('4d6L')}`)
  })
})

describe('copyLink', () => {
  test('is an async function that resolves without throwing', async () => {
    await expect(copyLink('4d6L')).resolves.toBeUndefined()
  })
})
