import { Sheet, YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { Pressable } from 'react-native'
import type { SavedRoll } from '../types'

type Props = {
  open: boolean
  savedRolls: SavedRoll[]
  currentNotation: string
  isCurrentValid: boolean
  onLoad: (notation: string) => void
  onDelete: (id: string) => void
  onSaveCurrent: () => void
  onClose: () => void
}

export function SavedRollsSheet({
  open, savedRolls, currentNotation, isCurrentValid,
  onLoad, onDelete, onSaveCurrent, onClose,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[60]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4" flex={1}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="bold" color="$color">Saved Rolls</Text>
            <Button
              size="$3"
              backgroundColor="$accent"
              disabled={!isCurrentValid}
              opacity={isCurrentValid ? 1 : 0.4}
              onPress={onSaveCurrent}
            >
              <Text color="white" fontSize="$2">+ Save Current</Text>
            </Button>
          </XStack>

          {savedRolls.length === 0 ? (
            <YStack flex={1} alignItems="center" justifyContent="center" opacity={0.4}>
              <Text color="$colorMuted">No saved rolls yet</Text>
            </YStack>
          ) : (
            <ScrollView flex={1}>
              <YStack>
                {savedRolls.map(roll => (
                  <XStack
                    key={roll.id}
                    paddingVertical="$3"
                    paddingHorizontal="$2"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    alignItems="center"
                    gap="$2"
                  >
                    <Pressable style={{ flex: 1 }} onPress={() => { onLoad(roll.notation); onClose() }}>
                      <Text fontSize="$4" color="$color">{roll.name}</Text>
                      <Text fontSize="$2" color="$colorMuted" fontFamily="$mono">{roll.notation}</Text>
                    </Pressable>
                    <Button
                      size="$2"
                      backgroundColor="transparent"
                      onPress={() => onDelete(roll.id)}
                    >
                      <Text color="$red8" fontSize="$2">Delete</Text>
                    </Button>
                  </XStack>
                ))}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
