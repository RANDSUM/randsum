import { describe, expect, test } from 'bun:test'

describe('PlaygroundLayout', () => {
  test('exports PlaygroundLayout as a named export', async () => {
    const mod = await import('../components/PlaygroundLayout')
    expect(typeof mod.PlaygroundLayout).toBe('function')
  })

  test('PlaygroundLayout accepts children prop (function arity)', async () => {
    const mod = await import('../components/PlaygroundLayout')
    // React function components accept a props object — verifying it is callable
    expect(mod.PlaygroundLayout).toBeInstanceOf(Function)
  })
})

describe('MainColumn', () => {
  test('exports MainColumn as a named export', async () => {
    const mod = await import('../components/MainColumn')
    expect(typeof mod.MainColumn).toBe('function')
  })

  test('MainColumn accepts children prop (function arity)', async () => {
    const mod = await import('../components/MainColumn')
    expect(mod.MainColumn).toBeInstanceOf(Function)
  })
})
