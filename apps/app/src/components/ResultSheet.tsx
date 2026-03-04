import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Button } from 'tamagui'
import type { HistoryEntry } from '../types'
import { NamePromptDialog } from './NamePromptDialog'

type Props = {
  entry: HistoryEntry | null
  open: boolean
  onClose: () => void
  onRollAgain: (notation: string) => void
  onSaveRoll: (name: string, notation: string) => void
}

function DiceBreakdown({ entry }: { entry: HistoryEntry }) {
  return (
    <YStack gap="$3">
      {entry.groups.map((group, gi) => (
        <YStack key={gi} gap="$1">
          <Text color="$colorMuted" fontSize="$2" fontFamily="$mono">
            {group.notation}
          </Text>
          <XStack flexWrap="wrap" gap="$3" alignItems="center">
            {group.initialRolls.map((val, i) => {
              const dropped = group.droppedIndices.includes(i)
              return (
                <Text
                  key={i}
                  fontSize="$5"
                  fontFamily="$mono"
                  color={dropped ? '$colorMuted' : '$color'}
                  textDecorationLine={dropped ? 'line-through' : 'none'}
                >
                  {val}
                </Text>
              )
            })}
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

export function ResultSheet({ entry, open, onClose, onRollAgain, onSaveRoll }: Props) {
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  if (!entry) return null

  return (
    <>
      <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[60]}>
        <Sheet.Overlay />
        <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
          <YStack gap="$4" flex={1}>
            <YStack gap="$1">
              <Text fontFamily="$mono" fontSize="$4" color="$color">{entry.notation}</Text>
              <Text fontSize="$2" color="$colorMuted">{entry.description}</Text>
            </YStack>

            <Text
              fontSize={72}
              fontWeight="bold"
              color="$accent"
              textAlign="center"
              fontFamily="$mono"
            >
              {entry.total}
            </Text>

            <DiceBreakdown entry={entry} />

            <XStack gap="$3" justifyContent="center" marginTop="auto">
              <Button
                size="$4"
                flex={1}
                backgroundColor="$backgroundMuted"
                borderColor="$borderColor"
                borderWidth={1}
                onPress={() => onRollAgain(entry.notation)}
              >
                <Text color="$color">Roll Again</Text>
              </Button>
              <Button
                size="$4"
                flex={1}
                backgroundColor="$accent"
                onPress={() => setShowNamePrompt(true)}
              >
                <Text color="white">Save Roll</Text>
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <NamePromptDialog
        open={showNamePrompt}
        onConfirm={name => onSaveRoll(name, entry.notation)}
        onClose={() => setShowNamePrompt(false)}
      />
    </>
  )
}
