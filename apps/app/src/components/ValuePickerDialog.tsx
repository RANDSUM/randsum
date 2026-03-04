import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Input, Button } from 'tamagui'

type Props = {
  open: boolean
  title: string
  onConfirm: (value: number) => void
  onClose: () => void
}

export function ValuePickerDialog({ open, title, onConfirm, onClose }: Props) {
  const [input, setInput] = useState('')

  const handleConfirm = () => {
    const num = parseInt(input, 10)
    if (!isNaN(num) && num > 0) {
      onConfirm(num)
      setInput('')
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[30]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold" color="$color">{title}</Text>
          <Input
            keyboardType="number-pad"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleConfirm}
            placeholder="Enter a number"
            placeholderTextColor="$placeholderColor"
            color="$color"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$3"
            paddingHorizontal="$3"
            autoFocus
          />
          <XStack gap="$2" justifyContent="flex-end">
            <Button size="$3" onPress={onClose} backgroundColor="$backgroundMuted">
              <Text color="$colorMuted">Cancel</Text>
            </Button>
            <Button size="$3" onPress={handleConfirm} backgroundColor="$accent">
              <Text color="white">Confirm</Text>
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
