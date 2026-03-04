import { useState } from 'react'
import { XStack, YStack, Button, Text } from 'tamagui'
import { ValuePickerDialog } from './ValuePickerDialog'

const SIMPLE_MODIFIERS = [
  { label: 'Drop Lowest', char: 'L' },
  { label: 'Drop Highest', char: 'H' },
  { label: 'Explode', char: '!' },
  { label: 'Unique', char: 'U' },
] as const

type Props = {
  notation: string
  onToggleModifier: (char: string) => void
  onAppendModifier: (suffix: string) => void
}

type PickerState = { open: boolean; type: 'add' | 'subtract' }

export function ModifierButtons({ notation, onToggleModifier, onAppendModifier }: Props) {
  const [picker, setPicker] = useState<PickerState>({ open: false, type: 'add' })

  const handleConfirm = (value: number) => {
    onAppendModifier(picker.type === 'add' ? `+${value}` : `-${value}`)
  }

  return (
    <YStack gap="$2">
      <XStack flexWrap="wrap" gap="$2" justifyContent="center">
        {SIMPLE_MODIFIERS.map(({ label, char }) => {
          const active = notation.includes(char)
          return (
            <Button
              key={char}
              size="$3"
              backgroundColor={active ? '$accent' : '$backgroundStrong'}
              borderColor={active ? '$accent' : '$borderColor'}
              borderWidth={1}
              borderRadius="$3"
              onPress={() => onToggleModifier(char)}
            >
              <Text color={active ? 'white' : '$colorMuted'} fontSize="$2">
                {label}
              </Text>
            </Button>
          )
        })}
      </XStack>
      <XStack gap="$2" justifyContent="center">
        <Button
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => setPicker({ open: true, type: 'add' })}
        >
          <Text color="$colorMuted" fontSize="$2">Add…</Text>
        </Button>
        <Button
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => setPicker({ open: true, type: 'subtract' })}
        >
          <Text color="$colorMuted" fontSize="$2">Subtract…</Text>
        </Button>
      </XStack>
      <ValuePickerDialog
        open={picker.open}
        title={picker.type === 'add' ? 'Add a value' : 'Subtract a value'}
        onConfirm={handleConfirm}
        onClose={() => setPicker(prev => ({ ...prev, open: false }))}
      />
    </YStack>
  )
}
