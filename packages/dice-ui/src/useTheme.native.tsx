import { createContext, useContext } from 'react'

type ColorScheme = 'light' | 'dark'

const DiceUIThemeContext = createContext<ColorScheme>('dark')

export function DiceUIThemeProvider({
  theme,
  children
}: {
  readonly theme: ColorScheme
  readonly children: React.ReactNode
}): React.JSX.Element {
  return <DiceUIThemeContext.Provider value={theme}>{children}</DiceUIThemeContext.Provider>
}

export function useTheme(): ColorScheme {
  return useContext(DiceUIThemeContext)
}

export function getTheme(): ColorScheme {
  return 'dark'
}

export function subscribeTheme(_cb: () => void): () => void {
  return () => {}
}
