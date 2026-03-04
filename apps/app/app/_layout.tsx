import { TamaguiProvider } from 'tamagui'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { config } from '../tamagui.config'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  )
}
