import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { getTokens } from '../lib/theme'
import { useThemeStore } from '../lib/stores/themeStore'

mock.module('react-native', () => ({
  useColorScheme: () => 'dark',
  Platform: { OS: 'web' },
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  },
  Linking: {
    openURL: async (_url: string): Promise<void> => undefined
  },
  Share: {
    share: async (_opts: { message: string; url?: string }): Promise<{ action: string }> => ({
      action: 'sharedAction'
    })
  }
}))

mock.module('../hooks/useTheme', () => ({
  useTheme: () => ({
    tokens: getTokens('dark'),
    fontSizes: { xs: 11, sm: 13, base: 15, lg: 17, xl: 22, '2xl': 32, '3xl': 48 },
    colorScheme: 'dark' as const,
    toggleTheme: () => {}
  })
}))

type NotationState = {
  notation: string
  isValid: boolean
  hasError: boolean
  setNotation: (n: string) => void
  clear: () => void
}
const _ns: NotationState = {
  notation: '2d6',
  isValid: true,
  hasError: false,
  setNotation(n: string) {
    _ns.notation = n
    _ns.isValid = /^\d*d\d+/.test(n)
    _ns.hasError = n.length > 0 && !_ns.isValid
  },
  clear() {
    _ns.notation = ''
    _ns.isValid = false
    _ns.hasError = false
  }
}
const _useNotationStore = Object.assign(<T,>(sel: (s: NotationState) => T): T => sel(_ns), {
  getState: (): NotationState => _ns,
  setState: (patch: Partial<NotationState>) => {
    Object.assign(_ns, patch)
  }
})
mock.module('../lib/stores/notationStore', () => ({
  useNotationStore: _useNotationStore
}))

const { WebHeader } = await import('../components/WebHeader')

type ReactEl = {
  type: string
  props: Record<string, unknown>
}

function flattenChildren(el: ReactEl): ReactEl[] {
  const result: ReactEl[] = []
  const ch = el.props['children']
  const items = Array.isArray(ch) ? ch : ch !== null && ch !== undefined ? [ch] : []
  for (const item of items) {
    if (item !== null && typeof item === 'object' && 'type' in item) {
      result.push(item as ReactEl)
      result.push(...flattenChildren(item as ReactEl))
    }
  }
  return result
}

describe('WebHeader (unified)', () => {
  beforeEach(() => {
    useThemeStore.setState({
      colorScheme: 'dark',
      tokens: getTokens('dark')
    })
  })

  test('is exported as a function', () => {
    expect(typeof WebHeader).toBe('function')
  })

  test('renders non-null', () => {
    const result = WebHeader()
    expect(result).not.toBeNull()
  })

  test('renders RANDSUM wordmark', () => {
    const root = WebHeader() as ReactEl
    const all = flattenChildren(root)
    const wordmark = all.find(c => c.type === 'Text' && c.props['children'] === 'RANDSUM')
    expect(wordmark).toBeDefined()
  })

  test('renders menu toggle button', () => {
    const root = WebHeader() as ReactEl
    const all = flattenChildren(root)
    const menuBtn = all.find(
      c =>
        c.type === 'Pressable' &&
        (c.props['accessibilityLabel'] === 'Open menu' ||
          c.props['accessibilityLabel'] === 'Close menu')
    )
    expect(menuBtn).toBeDefined()
  })
})
