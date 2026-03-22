import { Stack } from 'expo-router'

export default function RootLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wizard" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
