export interface ThemeTokens {
  readonly bg: string
  readonly surface: string
  readonly surfaceAlt: string
  readonly border: string
  readonly text: string
  readonly textMuted: string
  readonly textDim: string
  readonly accent: string
  readonly accentLow: string
  readonly accentHigh: string
  readonly error: string
  readonly success: string
}

export interface FontSizes {
  readonly xs: 11
  readonly sm: 13
  readonly base: 15
  readonly lg: 17
  readonly xl: 22
  readonly '2xl': 32
  readonly '3xl': 48
}

export type ColorScheme = 'dark' | 'light'

export const darkTokens: ThemeTokens = {
  bg: '#1a1a1f',
  surface: '#222228',
  surfaceAlt: '#2e2e35',
  border: '#52525b',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  accent: '#a855f7',
  accentLow: '#2e1065',
  accentHigh: '#d8b4fe',
  error: '#ef4444',
  success: '#10b981'
}

export const lightTokens: ThemeTokens = {
  bg: '#f4f4f6',
  surface: '#ebebed',
  surfaceAlt: '#e4e4e7',
  border: '#a1a1aa',
  text: '#18181b',
  textMuted: '#3f3f46',
  textDim: '#71717a',
  accent: '#7c3aed',
  accentLow: '#f5f0ff',
  accentHigh: '#5b21b6',
  error: '#dc2626',
  success: '#059669'
}

export const fontSizes: FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 22,
  '2xl': 32,
  '3xl': 48
}

export function getTokens(mode: ColorScheme): ThemeTokens {
  return mode === 'dark' ? darkTokens : lightTokens
}
