import { Text, YStack } from 'tamagui'

export default function HomeScreen() {
  return (
    // @ts-expect-error Tamagui children type incompatibility with strict index signatures
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      {/* @ts-expect-error Tamagui children type incompatibility with strict index signatures */}
      <Text color="$color" fontSize="$6" fontWeight="bold" letterSpacing={2}>
        RANDSUM
      </Text>
    </YStack>
  )
}
