import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme
} from '@react-navigation/native'
import { useColorScheme } from 'react-native'
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  adaptNavigationTheme,
  useTheme
} from 'react-native-paper'

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
})

const colors = {
  primary: {
    light: '#6200ee',
    dark: '#bb86fc'
  },
  secondary: {
    light: '#03dac6',
    dark: '#03dac6'
  },
  error: {
    light: '#b00020',
    dark: '#cf6679'
  },
  background: {
    light: '#f6f6f6',
    dark: '#121212'
  },
  surface: {
    light: '#ffffff',
    dark: '#1e1e1e'
  },
  text: {
    light: '#000000',
    dark: '#ffffff'
  },
  dice: {
    d4: '#FF5252', // Red
    d6: '#FFD740', // Amber
    d8: '#64FFDA', // Teal
    d10: '#448AFF', // Blue
    d12: '#B388FF', // Deep Purple
    d20: '#69F0AE', // Green
    d100: '#FF80AB' // Pink
  }
}

export const CustomLightTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: colors.primary.light,
    secondary: colors.secondary.light,
    error: colors.error.light,
    background: colors.background.light,
    surface: colors.surface.light,
    text: colors.text.light,
    // Add dice colors
    ...Object.entries(colors.dice).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {}
    )
  }
}

export const CustomDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: colors.primary.dark,
    secondary: colors.secondary.dark,
    error: colors.error.dark,
    background: colors.background.dark,
    surface: colors.surface.dark,
    text: colors.text.dark,
    // Add dice colors (same in both themes)
    ...Object.entries(colors.dice).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {}
    )
  }
}

export type AppTheme = typeof CustomLightTheme

export const useAppTheme = (): AppTheme => useTheme<AppTheme>()

export { useTheme } from 'react-native-paper'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme

  return <PaperProvider theme={theme}>{children}</PaperProvider>
}
