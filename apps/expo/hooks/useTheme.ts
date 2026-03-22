import type { ColorScheme, FontSizes, ThemeTokens } from '../lib/stores/themeStore'
import { useThemeStore } from '../lib/stores/themeStore'

interface UseThemeReturn {
  readonly tokens: ThemeTokens
  readonly fontSizes: FontSizes
  readonly colorScheme: ColorScheme
  readonly toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  const tokens = useThemeStore(s => s.tokens)
  const fontSizes = useThemeStore(s => s.fontSizes)
  const colorScheme = useThemeStore(s => s.colorScheme)
  const toggleTheme = useThemeStore(s => s.toggleTheme)

  return { tokens, fontSizes, colorScheme, toggleTheme }
}
