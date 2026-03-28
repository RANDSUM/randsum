import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { DiceUIThemeProvider } from '@randsum/dice-ui'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import Head from 'expo-router/head'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { CSSTokens } from '../components/CSSTokens'
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
      <Head>
        <title>RANDSUM Dice Playground — Roll Dice Online</title>
        <meta
          name="description"
          content="Roll dice online with full RANDSUM notation support. Free dice roller for tabletop RPGs including D&D, Blades in the Dark, Daggerheart, and more."
        />
        <meta property="og:title" content="RANDSUM Dice Playground — Roll Dice Online" />
        <meta
          property="og:description"
          content="Roll dice online with full RANDSUM notation support. Free dice roller for tabletop RPGs including D&D, Blades in the Dark, Daggerheart, and more."
        />
        <meta property="og:image" content="https://randsum.dev/og-image.svg" />
        <meta property="og:url" content="https://randsum.io/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RANDSUM Dice Playground — Roll Dice Online" />
        <meta
          name="twitter:description"
          content="Roll dice online with full RANDSUM notation support. Free dice roller for tabletop RPGs including D&D, Blades in the Dark, Daggerheart, and more."
        />
        <meta name="twitter:image" content="https://randsum.dev/og-image.svg" />
        <link rel="canonical" href="https://randsum.io/" />
      </Head>
      <CSSTokens />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </DiceUIThemeProvider>
  )
}
