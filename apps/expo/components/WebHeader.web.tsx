import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'
import { copyLink } from '../lib/sharing'
import { useNotationStore } from '../lib/stores/notationStore'

export function WebHeader(): React.JSX.Element {
  const { tokens, fontSizes, colorScheme, toggleTheme } = useTheme()
  const notation = useNotationStore(s => s.notation)

  function handleDocsLink(): void {
    void Linking.openURL('https://randsum.dev')
  }

  function handleNotationLink(): void {
    void Linking.openURL('https://notation.randsum.dev')
  }

  function handleCopyLink(): void {
    void copyLink(notation)
  }

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.bg,
      gap: 12
    },
    wordmarkWrap: {
      flex: 1
    },
    wordmark: {
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: tokens.text
    },
    button: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderRadius: 6,
      borderColor: tokens.border
    },
    linkText: {
      fontSize: fontSizes.sm,
      color: tokens.textMuted
    },
    buttonText: {
      fontSize: fontSizes.sm,
      color: tokens.text,
      fontFamily: 'JetBrainsMono_400Regular'
    }
  })

  return (
    <View style={styles.header}>
      <View style={styles.wordmarkWrap}>
        <Text style={styles.wordmark} accessibilityRole="text">
          RANDSUM Dice Notation Playground
        </Text>
      </View>

      <Pressable
        onPress={handleDocsLink}
        style={styles.button}
        accessibilityRole="link"
        accessibilityLabel="Open RANDSUM documentation"
      >
        <Text style={styles.linkText}>Docs</Text>
      </Pressable>

      <Pressable
        onPress={handleNotationLink}
        style={styles.button}
        accessibilityRole="link"
        accessibilityLabel="Open dice notation specification"
      >
        <Text style={styles.linkText}>Notation</Text>
      </Pressable>

      <Pressable
        onPress={handleCopyLink}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Copy link to this notation"
      >
        <Text style={styles.buttonText}>Copy Link</Text>
      </Pressable>

      <Pressable
        onPress={toggleTheme}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <Text style={styles.buttonText}>{colorScheme === 'dark' ? 'Light' : 'Dark'}</Text>
      </Pressable>
    </View>
  )
}
