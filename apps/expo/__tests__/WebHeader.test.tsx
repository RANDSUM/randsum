import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { getTokens } from '../lib/theme'
import { useThemeStore } from '../lib/stores/themeStore'

// Use string intrinsics so React.createElement produces typed elements: { type: 'View' } etc.
// Share, StyleSheet, Platform retained to match setup.ts and avoid breaking other tests.
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

// Mock useTheme to avoid Zustand hook calls outside React — does not affect other test files
// because they import useThemeStore directly, not useTheme.
mock.module('../hooks/useTheme', () => ({
  useTheme: () => ({
    tokens: getTokens('dark'),
    fontSizes: { xs: 11, sm: 13, base: 15, lg: 17, xl: 22, '2xl': 32, '3xl': 48 },
    colorScheme: 'dark' as const,
    toggleTheme: () => {}
  })
}))

// Mock notationStore so the component's useNotationStore selector call does not
// invoke the real Zustand hook (which crashes outside a React component tree).
// The mock preserves .getState() and .setState() so useNotationStore.test.ts
// passes whether it runs before or after this file.
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
const _useNotationStore = Object.assign(
  // trailing comma disambiguates generic from JSX in .tsx files
  <T,>(sel: (s: NotationState) => T): T => sel(_ns),
  {
    getState: (): NotationState => _ns,
    setState: (patch: Partial<NotationState>) => {
      Object.assign(_ns, patch)
    }
  }
)
mock.module('../lib/stores/notationStore', () => ({
  useNotationStore: _useNotationStore
}))

// Dynamic imports ensure mocks are active before module resolution
const { WebHeader: WebHeaderWeb } = await import('../components/WebHeader.web')
const { WebHeader: WebHeaderNative } = await import('../components/WebHeader')

type ReactEl = {
  type: string
  props: Record<string, unknown>
}

function getChildren(el: ReactEl): ReactEl[] {
  const ch = el.props['children']
  if (Array.isArray(ch)) return ch as ReactEl[]
  if (ch !== null && ch !== undefined) return [ch as ReactEl]
  return []
}

describe('WebHeader (native stub)', () => {
  test('native stub is exported', () => {
    expect(typeof WebHeaderNative).toBe('function')
  })

  test('native stub returns null', () => {
    expect(WebHeaderNative()).toBeNull()
  })
})

describe('WebHeader (web variant)', () => {
  beforeEach(() => {
    useThemeStore.setState({
      colorScheme: 'dark',
      tokens: getTokens('dark')
    })
  })

  test('web variant is exported', () => {
    expect(typeof WebHeaderWeb).toBe('function')
  })

  test('web variant renders non-null', () => {
    const result = WebHeaderWeb()
    expect(result).not.toBeNull()
  })

  test('web variant renders RANDSUM wordmark', () => {
    const root = WebHeaderWeb() as ReactEl
    // Wordmark Text is nested inside a flex:1 View wrapper
    const children = getChildren(root)
    const wordmarkWrap = children.find(c => c.type === 'View') as ReactEl
    expect(wordmarkWrap).toBeDefined()
    const innerChildren = getChildren(wordmarkWrap)
    const wordmark = innerChildren.find(c => c.type === 'Text' && c.props['children'] === 'RANDSUM')
    expect(wordmark).toBeDefined()
  })

  test('wordmark text uses accent color', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const wordmarkWrap = children.find(c => c.type === 'View') as ReactEl
    const innerChildren = getChildren(wordmarkWrap)
    const wordmark = innerChildren.find(c => c.type === 'Text' && c.props['children'] === 'RANDSUM')
    const style = wordmark?.props['style'] as Record<string, unknown> | undefined
    expect(style?.['color']).toBe(getTokens('dark').accent)
  })

  test('theme toggle label is "Light" in dark mode', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const themeButton = children.find(
      c => c.type === 'Pressable' && c.props['accessibilityLabel'] === 'Switch to light mode'
    )
    expect(themeButton).toBeDefined()
  })

  test('Docs link has accessibilityRole="link"', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const docsLink = children.find(
      c => c.type === 'Pressable' && c.props['accessibilityLabel'] === 'Open RANDSUM documentation'
    )
    expect(docsLink).toBeDefined()
    expect(docsLink?.props['accessibilityRole']).toBe('link')
  })

  test('Notation link has accessibilityRole="link"', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const notationLink = children.find(
      c =>
        c.type === 'Pressable' &&
        c.props['accessibilityLabel'] === 'Open dice notation specification'
    )
    expect(notationLink).toBeDefined()
    expect(notationLink?.props['accessibilityRole']).toBe('link')
  })

  test('Copy Link button has accessibilityRole="button"', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const copyButton = children.find(
      c => c.type === 'Pressable' && c.props['accessibilityLabel'] === 'Copy link to this notation'
    )
    expect(copyButton).toBeDefined()
    expect(copyButton?.props['accessibilityRole']).toBe('button')
  })

  test('theme toggle has accessibilityRole="button"', () => {
    const root = WebHeaderWeb() as ReactEl
    const children = getChildren(root)
    const themeButton = children.find(
      c => c.type === 'Pressable' && c.props['accessibilityLabel'] === 'Switch to light mode'
    )
    expect(themeButton?.props['accessibilityRole']).toBe('button')
  })
})
