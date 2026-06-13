import { beforeEach, describe, expect, test } from 'bun:test'

import { darkTokens, getTokens, lightTokens } from '../lib/theme'
import { useThemeStore } from '../lib/stores/themeStore'

describe('getTokens', () => {
  test('returns dark tokens for dark mode', () => {
    const tokens = getTokens('dark')
    expect(tokens.accent).toBe('#a855f7')
    expect(tokens.bg).toBe('#1a1a1f')
    expect(tokens.surface).toBe('#222228')
    expect(tokens.surfaceAlt).toBe('#2e2e35')
    expect(tokens.border).toBe('#52525b')
    expect(tokens.text).toBe('#fafafa')
    expect(tokens.textMuted).toBe('#a1a1aa')
    expect(tokens.textDim).toBe('#71717a')
    expect(tokens.accentHigh).toBe('#d8b4fe')
    expect(tokens.error).toBe('#ef4444')
    expect(tokens.success).toBe('#10b981')
  })

  test('returns light tokens for light mode', () => {
    const tokens = getTokens('light')
    expect(tokens.bg).toBe('#f4f4f6')
    expect(tokens.surface).toBe('#ebebed')
    expect(tokens.surfaceAlt).toBe('#e4e4e7')
    expect(tokens.border).toBe('#a1a1aa')
    expect(tokens.text).toBe('#18181b')
    expect(tokens.textMuted).toBe('#3f3f46')
    expect(tokens.textDim).toBe('#71717a')
    expect(tokens.accent).toBe('#7c3aed')
    expect(tokens.accentHigh).toBe('#5b21b6')
    expect(tokens.error).toBe('#dc2626')
    expect(tokens.success).toBe('#059669')
  })

  test('darkTokens and lightTokens match getTokens output', () => {
    expect(getTokens('dark')).toEqual(darkTokens)
    expect(getTokens('light')).toEqual(lightTokens)
  })
})

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      colorScheme: 'dark',
      tokens: getTokens('dark')
    })
  })

  test('initial state has dark mode and dark tokens', () => {
    const state = useThemeStore.getState()
    expect(state.colorScheme).toBe('dark')
    expect(state.tokens).toEqual(darkTokens)
  })

  test('setTheme("light") sets light scheme and light tokens', () => {
    useThemeStore.getState().setTheme('light')
    const state = useThemeStore.getState()
    expect(state.colorScheme).toBe('light')
    expect(state.tokens).toEqual(lightTokens)
  })

  test('setTheme("dark") sets dark scheme and dark tokens', () => {
    useThemeStore.getState().setTheme('light')
    useThemeStore.getState().setTheme('dark')
    const state = useThemeStore.getState()
    expect(state.colorScheme).toBe('dark')
    expect(state.tokens).toEqual(darkTokens)
  })

  test('toggleTheme flips from dark to light', () => {
    expect(useThemeStore.getState().colorScheme).toBe('dark')
    useThemeStore.getState().toggleTheme()
    const state = useThemeStore.getState()
    expect(state.colorScheme).toBe('light')
    expect(state.tokens).toEqual(lightTokens)
  })

  test('toggleTheme flips from light to dark', () => {
    useThemeStore.getState().setTheme('light')
    useThemeStore.getState().toggleTheme()
    const state = useThemeStore.getState()
    expect(state.colorScheme).toBe('dark')
    expect(state.tokens).toEqual(darkTokens)
  })

  test('fontSizes are correct', () => {
    const { fontSizes } = useThemeStore.getState()
    expect(fontSizes.xs).toBe(11)
    expect(fontSizes.sm).toBe(13)
    expect(fontSizes.base).toBe(15)
    expect(fontSizes.lg).toBe(17)
    expect(fontSizes.xl).toBe(22)
    expect(fontSizes['2xl']).toBe(32)
    expect(fontSizes['3xl']).toBe(48)
  })
})
