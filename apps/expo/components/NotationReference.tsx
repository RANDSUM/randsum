import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface NotationItem {
  readonly label: string
  readonly fragment: string
  readonly description: string
}

interface NotationCategory {
  readonly name: string
  readonly items: readonly NotationItem[]
}

const NOTATION_CATEGORIES: readonly NotationCategory[] = [
  {
    name: 'Basic',
    items: [
      { label: 'NdS', fragment: '1d20', description: 'Roll N dice with S sides' },
      { label: 'd%', fragment: 'd%', description: 'Percentile (1d100)' },
      { label: 'dF', fragment: 'dF', description: 'Fate die (-1 to +1)' }
    ]
  },
  {
    name: 'Arithmetic',
    items: [
      { label: '+N', fragment: '+5', description: 'Add to total' },
      { label: '-N', fragment: '-2', description: 'Subtract from total' }
    ]
  },
  {
    name: 'Drop',
    items: [
      { label: 'L', fragment: 'L', description: 'Drop lowest' },
      { label: 'H', fragment: 'H', description: 'Drop highest' }
    ]
  },
  {
    name: 'Reroll',
    items: [{ label: 'R{<N}', fragment: 'R{<2}', description: 'Reroll below N' }]
  },
  {
    name: 'Explode',
    items: [
      { label: '!', fragment: '!', description: 'Explode on max' },
      { label: '!{>N}', fragment: '!{>5}', description: 'Explode above N' }
    ]
  },
  {
    name: 'Other',
    items: [
      { label: 'U', fragment: 'U', description: 'Unique rolls' },
      { label: 'C{<N,>M}', fragment: 'C{<1,>6}', description: 'Cap values' },
      { label: 'xN', fragment: 'x6', description: 'Repeat N times' }
    ]
  }
]

interface NotationReferenceProps {
  readonly onAppend: (fragment: string) => void
}

export function NotationReference({ onAppend }: NotationReferenceProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {NOTATION_CATEGORIES.map(category => (
        <View key={category.name} style={styles.category}>
          <Text style={[styles.categoryName, { color: tokens.textMuted, fontSize: fontSizes.xs }]}>
            {category.name}
          </Text>
          <View style={styles.chips}>
            {category.items.map(item => (
              <Pressable
                key={item.label}
                onPress={() => onAppend(item.fragment)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}: ${item.description}`}
                accessibilityHint="Tap to append to notation"
                style={[styles.chip, { backgroundColor: tokens.surfaceAlt }]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: tokens.text,
                      fontSize: fontSizes.sm,
                      fontFamily: 'JetBrainsMono_400Regular'
                    }
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    gap: 12,
    paddingVertical: 8
  },
  category: {
    gap: 6
  },
  categoryName: {
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipLabel: {
    fontWeight: '500'
  }
})
