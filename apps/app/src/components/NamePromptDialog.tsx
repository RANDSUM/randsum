import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Input, Button } from 'tamagui'

type Props = {
  open: boolean
  onConfirm: (name: string) => void
  onClose: () => void
}

export function NamePromptDialog({ open, onConfirm, onClose }: Props) {
  const [name, setName] = useState('')

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
      setName('')
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[30]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold" color="$color">Name this roll</Text>
          <Input
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleConfirm}
            placeholder="e.g. Attack Roll"
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
            <Button
              size="$3"
              onPress={handleConfirm}
              backgroundColor="$accent"
              disabled={!name.trim()}
              opacity={name.trim() ? 1 : 0.4}
            >
              <Text color="white">Save</Text>
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
