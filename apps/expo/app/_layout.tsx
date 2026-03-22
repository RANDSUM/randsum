import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { initThemeFromSystem } from '../lib/stores/themeStore'

SplashScreen.preventAutoHideAsync()

export default function RootLayout(): React.JSX.Element | null {
  const [loaded] = useFonts({ JetBrainsMono_400Regular })
  const systemScheme = useColorScheme()

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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wizard" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
