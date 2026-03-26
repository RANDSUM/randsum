import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { getTokens } from '../lib/theme'

// Minimal React + JSX runtime — produces plain objects { type, props } so tests can
// inspect the element tree without a real React renderer.
function createElement(
  type: unknown,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): object {
  const resolvedChildren =
    children.length === 0 ? undefined : children.length === 1 ? children[0] : children
  return {
    type,
    props: {
      ...(props ?? {}),
      ...(resolvedChildren !== undefined ? { children: resolvedChildren } : {})
    }
  }
}

const reactMock = {
  createElement,
  // hooks used by IndexScreen
  useState: <T,>(initial: T): [T, (v: T) => void] => [initial, () => {}],
  useEffect: (_fn: () => void | (() => void), _deps?: unknown[]) => {},
  useRef: <T,>(initial: T): { current: T } => ({ current: initial }),
  Fragment: 'Fragment',
  default: {} as Record<string, unknown>
}
reactMock.default = reactMock

mock.module('react', () => reactMock)
// In the React 19 JSX transform, children are passed inside the props object.
// We just pass props through directly so { children: [...] } is preserved.
function jsxFactory(type: unknown, props: Record<string, unknown> | null): object {
  return { type, props: props ?? {} }
}

mock.module('react/jsx-dev-runtime', () => ({
  jsxDEV: (
    type: unknown,
    props: Record<string, unknown> | null,
    _key: unknown,
    _isStatic: unknown,
    _source: unknown,
    _self: unknown
  ) => jsxFactory(type, props),
  Fragment: 'Fragment'
}))
mock.module('react/jsx-runtime', () => ({
  jsx: jsxFactory,
  jsxs: jsxFactory,
  Fragment: 'Fragment'
}))

// Mocked window dimensions — overridden per test
const _dims = { width: 1024, height: 768 }

mock.module('react-native', () => ({
  useColorScheme: () => 'dark',
  Platform: { OS: 'web' },
  Modal: 'Modal',
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  },
  useWindowDimensions: () => ({ width: _dims.width, height: _dims.height }),
  Share: {
    share: async (_opts: { message: string; url?: string }): Promise<{ action: string }> => ({
      action: 'sharedAction'
    })
  },
  Linking: {
    openURL: async (_url: string): Promise<void> => undefined
  }
}))

mock.module('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView'
}))

mock.module('../hooks/useTheme', () => ({
  useTheme: () => ({
    tokens: getTokens('dark'),
    fontSizes: { xs: 11, sm: 13, base: 15, lg: 17, xl: 22, '2xl': 32, '3xl': 48 },
    colorScheme: 'dark' as const,
    toggleTheme: () => {}
  })
}))

mock.module('../components/WebHeader', () => ({
  WebHeader: () => null
}))

mock.module('../components/RollResultView', () => ({
  RollResultView: () => null
}))

mock.module('@randsum/dice-ui', () => ({
  NotationRoller: 'NotationRoller',
  QuickReferenceGrid: 'QuickReferenceGrid'
}))

mock.module('../lib/sharing', () => ({
  buildNotationUrl: (_n: string) => '',
  copyLink: async (_n: string): Promise<void> => undefined
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
  },
  clear() {
    _ns.notation = ''
  }
}

mock.module('../lib/stores/notationStore', () => ({
  useNotationStore: <T,>(sel: (s: NotationState) => T): T => sel(_ns)
}))

const { default: IndexScreen } = await import('../app/index')

type ReactEl = {
  type: string
  props: Record<string, unknown>
}

function isEl(v: unknown): v is ReactEl {
  return (
    v !== null &&
    typeof v === 'object' &&
    'type' in (v as object) &&
    'props' in (v as object) &&
    typeof (v as ReactEl).props === 'object' &&
    (v as ReactEl).props !== null
  )
}

function getChildren(el: ReactEl): ReactEl[] {
  const ch = el.props['children']
  if (Array.isArray(ch)) return (ch as unknown[]).filter(isEl) as ReactEl[]
  if (isEl(ch)) return [ch]
  return []
}

// Flatten a StyleSheet style value (object or array of objects) into one merged object
function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return (style as unknown[]).reduce<Record<string, unknown>>((acc, s) => {
      if (s !== null && typeof s === 'object') return { ...acc, ...(s as Record<string, unknown>) }
      return acc
    }, {})
  }
  if (style !== null && typeof style === 'object') return style as Record<string, unknown>
  return {}
}

function findAll(el: ReactEl, predicate: (e: ReactEl) => boolean): ReactEl[] {
  const results: ReactEl[] = []
  if (predicate(el)) results.push(el)
  for (const child of getChildren(el)) {
    results.push(...findAll(child, predicate))
  }
  return results
}

describe('IndexScreen desktop layout (>= 768px, web)', () => {
  beforeEach(() => {
    _dims.width = 1024
    _dims.height = 768
  })

  test('renders two-column wrapper with testID desktop-two-col', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')
    expect(twoCol.length).toBe(1)
  })

  test('two-column wrapper has flexDirection row', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')[0] as ReactEl
    expect(twoCol).toBeDefined()
    const style = flatStyle(twoCol.props['style'])
    expect(style['flexDirection']).toBe('row')
  })

  test('left column has flex: 1', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')[0] as ReactEl
    const cols = getChildren(twoCol)
    const leftCol = cols[0] as ReactEl
    expect(leftCol).toBeDefined()
    const style = flatStyle(leftCol.props['style'])
    expect(style['flex']).toBe(1)
  })

  test('right column has flex: 1', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')[0] as ReactEl
    const cols = getChildren(twoCol)
    const rightCol = cols[1] as ReactEl
    expect(rightCol).toBeDefined()
    const style = flatStyle(rightCol.props['style'])
    expect(style['flex']).toBe(1)
  })

  test('right column has alignSelf flex-start for sticky positioning', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')[0] as ReactEl
    const cols = getChildren(twoCol)
    const rightCol = cols[1] as ReactEl
    const style = flatStyle(rightCol.props['style'])
    expect(style['alignSelf']).toBe('flex-start')
  })
})

describe('IndexScreen mobile layout (< 768px, web)', () => {
  beforeEach(() => {
    _dims.width = 375
    _dims.height = 812
  })

  test('does not render two-column wrapper at mobile width', () => {
    const root = IndexScreen() as ReactEl
    const twoCol = findAll(root, el => el.props['testID'] === 'desktop-two-col')
    expect(twoCol.length).toBe(0)
  })
})
