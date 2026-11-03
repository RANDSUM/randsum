// The native components' theme: the same tokens as the elements' --rsui-*
// custom properties, as a plain object, since React Native has no CSS. Wrap
// any part of an app in <RollerThemeProvider theme={{ accent: '#…' }}> to
// change them; the rest follow the device's light or dark scheme.
import type React from 'react'
import { createContext, createElement, useContext, useMemo } from 'react'
import { Platform, useColorScheme } from 'react-native'

export type RollerScheme = 'light' | 'dark'

export interface RollerTheme {
  /** Which notation token colours to use, the light or the dark set. */
  readonly scheme: RollerScheme
  readonly accent: string
  readonly onAccent: string
  readonly bg: string
  readonly surface: string
  readonly raised: string
  readonly subtle: string
  readonly border: string
  readonly borderStrong: string
  readonly ink: string
  readonly muted: string
  readonly faint: string
  readonly valid: string
  readonly invalid: string
  readonly disabledBg: string
  readonly disabledInk: string
  /** What dims the app behind mini's result card. */
  readonly scrim: string
  /** The added-die fill: the accent over `raised`, which CSS mixes for itself. */
  readonly addedBg: string
  /** Undefined uses the platform's system font. */
  readonly font: string | undefined
  readonly fontMono: string
  readonly textXs: number
  readonly textSm: number
  readonly textBase: number
  readonly textMd: number
  readonly textLg: number
  readonly textInput: number
  readonly totalCompact: number
  readonly totalMax: number
  readonly radiusSm: number
  readonly radiusMd: number
  readonly radiusLg: number
  readonly radiusXl: number
}

const MONO: string = Platform.select({ ios: 'Menlo', default: 'monospace' })

const SHARED = {
  accent: '#ef656b',
  onAccent: '#18181b',
  font: undefined,
  fontMono: MONO,
  textXs: 13,
  textSm: 14,
  textBase: 16,
  textMd: 18,
  textLg: 22,
  textInput: 24,
  totalCompact: 72,
  totalMax: 104,
  radiusSm: 6,
  radiusMd: 8,
  radiusLg: 12,
  radiusXl: 16
} as const

export const lightTheme: RollerTheme = {
  ...SHARED,
  scheme: 'light',
  bg: '#ffffff',
  surface: '#fafafa',
  raised: '#ffffff',
  subtle: '#f4f4f5',
  border: '#d4d4d8',
  borderStrong: '#71717a',
  ink: '#18181b',
  muted: '#52525b',
  faint: '#71717a',
  valid: '#15803d',
  invalid: '#b91c1c',
  disabledBg: '#e4e4e7',
  disabledInk: '#71717a',
  scrim: 'rgba(24, 24, 27, 0.4)',
  addedBg: '#fde9ea'
}

export const darkTheme: RollerTheme = {
  ...SHARED,
  scheme: 'dark',
  bg: '#18181b',
  surface: '#111113',
  raised: '#232326',
  subtle: '#27272a',
  border: '#3f3f46',
  borderStrong: '#a1a1aa',
  ink: '#fafafa',
  muted: '#a1a1aa',
  faint: '#8b8b94',
  valid: '#4ade80',
  invalid: '#f87171',
  disabledBg: '#2e2e33',
  disabledInk: '#8b8b94',
  scrim: 'rgba(0, 0, 0, 0.6)',
  addedBg: '#402c30'
}

const ThemeContext = createContext<Partial<RollerTheme> | null>(null)

export interface RollerThemeProviderProps {
  /** Tokens to change. The rest come from the light or dark theme. */
  readonly theme: Partial<RollerTheme>
  readonly children?: React.ReactNode
}

/** Changes the tokens of every native roller component inside it. */
export function RollerThemeProvider({
  theme,
  children
}: RollerThemeProviderProps): React.JSX.Element {
  const outer = useContext(ThemeContext)
  const merged = useMemo(() => ({ ...outer, ...theme }), [outer, theme])
  return createElement(ThemeContext.Provider, { value: merged }, children)
}

/** The theme in effect: the device's scheme, with any provider's tokens over it. */
export function useRollerTheme(): RollerTheme {
  const overrides = useContext(ThemeContext)
  const device = useColorScheme()
  const scheme = overrides?.scheme ?? (device === 'dark' ? 'dark' : 'light')
  return useMemo(
    () => ({ ...(scheme === 'dark' ? darkTheme : lightTheme), ...overrides, scheme }),
    [scheme, overrides]
  )
}
