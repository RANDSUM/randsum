import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface GameCardProps {
  readonly name: string
  readonly description: string
  readonly accentColor: string
  readonly onPress: () => void
}

export function GameCard({
  name,
  description,
  accentColor,
  onPress
}: GameCardProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${description}`}
      style={[styles.card, { backgroundColor: tokens.surface, borderLeftColor: accentColor }]}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: tokens.text, fontSize: fontSizes.base }]}>{name}</Text>
        <Text
          style={[styles.description, { color: tokens.textMuted, fontSize: fontSizes.sm }]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    minHeight: 44
  },
  content: {
    gap: 4
  },
  name: {
    fontWeight: '600'
  },
  description: {
    lineHeight: 18
  }
})
