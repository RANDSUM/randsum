import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { DiceUIThemeProvider } from '@randsum/dice-ui'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { initThemeFromSystem, useThemeStore } from '../lib/stores/themeStore'

SplashScreen.preventAutoHideAsync()

export default function RootLayout(): React.JSX.Element | null {
  const [loaded] = useFonts({ JetBrainsMono_400Regular })
  const systemScheme = useColorScheme()
  const colorScheme = useThemeStore(s => s.colorScheme)

  useEffect(() => {
    const scheme = systemScheme === 'dark' || systemScheme === 'light' ? systemScheme : null
    initThemeFromSystem(scheme)
  }, [systemScheme])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <DiceUIThemeProvider theme={colorScheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </DiceUIThemeProvider>
  )
}
