import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'

import { main } from '../src/index'

describe('main() mode dispatch', () => {
  const consoleSpy: {
    log: ReturnType<typeof spyOn<Console, 'log'>> | null
    error: ReturnType<typeof spyOn<Console, 'error'>> | null
  } = { log: null, error: null }

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleSpy.log = spyOn(console, 'log').mockImplementation((): void => {})
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleSpy.error = spyOn(console, 'error').mockImplementation((): void => {})
  })

  afterEach(() => {
    consoleSpy.log?.mockRestore()
    consoleSpy.error?.mockRestore()
  })

  test('--help flag prints help and returns', () => {
    main(['node', 'randsum', '--help'])
    expect(consoleSpy.log).toHaveBeenCalled()
    const output = consoleSpy.log?.mock.calls[0]?.[0] as string
    expect(output).toContain('Usage:')
  })

  test('-h flag prints help and returns', () => {
    main(['node', 'randsum', '-h'])
    expect(consoleSpy.log).toHaveBeenCalled()
  })

  test('--version flag prints version and returns', () => {
    main(['node', 'randsum', '--version'])
    expect(consoleSpy.log).toHaveBeenCalled()
  })

  test('-V flag prints version and returns', () => {
    main(['node', 'randsum', '-V'])
    expect(consoleSpy.log).toHaveBeenCalled()
  })

  test('notation arg routes to one-shot mode', () => {
    main(['node', 'randsum', '4d6L'])
    expect(consoleSpy.log).toHaveBeenCalled()
    const output = consoleSpy.log?.mock.calls[0]?.[0] as string
    expect(output).toMatch(/^\d+/)
  })

  test('multiple notation args route to one-shot mode', () => {
    main(['node', 'randsum', '2d6', '1d20'])
    expect(consoleSpy.log).toHaveBeenCalled()
  })
})
