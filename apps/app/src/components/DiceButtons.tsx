import { XStack, Button, Text } from 'tamagui'

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const

type Props = {
  onAddDie: (sides: number) => void
}

export function DiceButtons({ onAddDie }: Props) {
  return (
    <XStack flexWrap="wrap" gap="$2" justifyContent="center">
      {DICE_TYPES.map(sides => (
        <Button
          key={sides}
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => onAddDie(sides)}
          pressStyle={{ backgroundColor: '$backgroundMuted' }}
        >
          <Text color="$color" fontFamily="$mono" fontSize="$3">
            d{sides}
          </Text>
        </Button>
      ))}
    </XStack>
  )
}
