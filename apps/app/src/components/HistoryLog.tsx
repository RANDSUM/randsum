import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Pressable } from 'react-native'
import type { HistoryEntry } from '../types'

type Props = {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function HistoryLog({ history, onSelectEntry }: Props) {
  if (history.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" opacity={0.4}>
        <Text color="$colorMuted" fontSize="$3">No rolls yet</Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1}>
      <YStack>
        {history.map(entry => (
          <Pressable key={entry.id} onPress={() => onSelectEntry(entry)}>
            <XStack
              paddingVertical="$2"
              paddingHorizontal="$3"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              alignItems="center"
              gap="$3"
            >
              <Text fontFamily="$mono" fontSize="$3" color="$colorMuted" flex={1} numberOfLines={1}>
                {entry.notation}
              </Text>
              <Text fontSize="$5" fontWeight="bold" color="$accent" fontFamily="$mono">
                {entry.total}
              </Text>
              <Text fontSize="$2" color="$colorMuted" minWidth={60} textAlign="right">
                {relativeTime(entry.timestamp)}
              </Text>
              <Text color="$colorMuted" fontSize="$3">↗</Text>
            </XStack>
          </Pressable>
        ))}
      </YStack>
    </ScrollView>
  )
}
