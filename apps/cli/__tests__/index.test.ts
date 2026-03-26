import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

const mockRender = mock(() => ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unmount: (): void => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  waitUntilExit: async (): Promise<void> => {}
}))

const MockNotationRoller = (): null => null

void mock.module('ink', () => ({
  render: mockRender
}))

void mock.module('@randsum/dice-ui/ink', () => ({
  NotationRoller: MockNotationRoller
}))

// Import after mocks are set up
const { main } = await import('../src/index')

describe('main() mode dispatch', () => {
  const consoleSpy: { current: ReturnType<typeof spyOn<Console, 'log'>> | null } = { current: null }

  beforeEach(() => {
    mockRender.mockClear()
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleSpy.current = spyOn(console, 'log').mockImplementation((): void => {})
  })

  afterEach(() => {
    consoleSpy.current?.mockRestore()
  })

  test('--help flag prints help and returns without rendering', () => {
    main(['node', 'randsum', '--help'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
    const output = consoleSpy.current?.mock.calls[0]?.[0] as string
    expect(output).toContain('Usage:')
  })

  test('-h flag prints help and returns', () => {
    main(['node', 'randsum', '-h'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
  })

  test('--version flag prints version and returns without rendering', () => {
    main(['node', 'randsum', '--version'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
  })

  test('-V flag prints version and returns', () => {
    main(['node', 'randsum', '-V'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
  })

  test('no args launches Ink TUI via render()', () => {
    main(['node', 'randsum'])
    expect(mockRender).toHaveBeenCalledTimes(1)
  })

  test('notation arg routes to one-shot mode, not Ink TUI', () => {
    main(['node', 'randsum', '4d6L'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
    const output = consoleSpy.current?.mock.calls[0]?.[0] as string
    expect(output).toMatch(/^\d+/)
  })

  test('multiple notation args route to one-shot mode', () => {
    main(['node', 'randsum', '2d6', '1d20'])
    expect(mockRender).not.toHaveBeenCalled()
    expect(consoleSpy.current).toHaveBeenCalled()
  })
})
