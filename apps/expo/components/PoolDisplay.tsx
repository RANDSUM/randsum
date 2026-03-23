import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface PoolDisplayProps {
  readonly notation: string | null
}

export function PoolDisplay({ notation }: PoolDisplayProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const isEmpty = notation === null || notation === ''

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <Text
          accessibilityRole="text"
          accessibilityLabel="Pool is empty"
          style={[styles.empty, { color: tokens.textMuted, fontSize: fontSizes.base }]}
        >
          Select dice to add to your pool
        </Text>
      ) : (
        <Text
          accessibilityRole="text"
          accessibilityLabel={notation}
          style={[
            styles.notation,
            {
              color: tokens.text,
              fontSize: fontSizes.lg,
              fontFamily: 'JetBrainsMono_400Regular'
            }
          ]}
        >
          {notation}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56
  },
  notation: {
    textAlign: 'center'
  },
  empty: {
    textAlign: 'center'
  }
})
