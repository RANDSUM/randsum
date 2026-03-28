import { useState } from 'react'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'
import { copyLink } from '../lib/sharing'
import { useNotationStore } from '../lib/stores/notationStore'

export function WebHeader(): React.JSX.Element {
  const { tokens, fontSizes, colorScheme, toggleTheme } = useTheme()
  const notation = useNotationStore(s => s.notation)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleDocsLink(): void {
    void Linking.openURL('https://randsum.dev')
    setDrawerOpen(false)
  }

  function handleNotationLink(): void {
    void Linking.openURL('https://notation.randsum.dev')
    setDrawerOpen(false)
  }

  function handleCopyLink(): void {
    if (Platform.OS === 'web') {
      void copyLink(notation)
    }
    setDrawerOpen(false)
  }

  function handleToggleTheme(): void {
    toggleTheme()
    setDrawerOpen(false)
  }

  const dynamicStyles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.bg
    },
    wordmark: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: tokens.accent
    },
    subtitle: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: fontSizes.sm,
      color: tokens.text,
      marginLeft: 8
    },
    menuButton: {
      padding: 8
    },
    menuIcon: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: fontSizes.lg,
      color: tokens.text
    },
    drawer: {
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 4
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 6
    },
    drawerText: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: fontSizes.base,
      color: tokens.text
    },
    drawerTextMuted: {
      fontFamily: 'JetBrainsMono_400Regular',
      fontSize: fontSizes.base,
      color: tokens.textMuted
    }
  })

  return (
    <View accessibilityRole="header">
      <View style={dynamicStyles.header}>
        <View style={styles.wordmarkWrap}>
          <Text style={dynamicStyles.wordmark}>RANDSUM</Text>
          <Text style={dynamicStyles.subtitle}>Dice Notation Playground</Text>
        </View>

        <Pressable
          onPress={() => setDrawerOpen(prev => !prev)}
          style={dynamicStyles.menuButton}
          accessibilityRole="button"
          accessibilityLabel={drawerOpen ? 'Close menu' : 'Open menu'}
        >
          <Text style={dynamicStyles.menuIcon}>{drawerOpen ? '\u2715' : '\u2630'}</Text>
        </Pressable>
      </View>

      {drawerOpen && (
        <View style={dynamicStyles.drawer}>
          <Pressable
            onPress={handleDocsLink}
            style={dynamicStyles.drawerItem}
            accessibilityRole="link"
          >
            <Text style={dynamicStyles.drawerTextMuted}>Docs</Text>
          </Pressable>

          <Pressable
            onPress={handleNotationLink}
            style={dynamicStyles.drawerItem}
            accessibilityRole="link"
          >
            <Text style={dynamicStyles.drawerTextMuted}>Notation Spec</Text>
          </Pressable>

          {Platform.OS === 'web' && (
            <Pressable
              onPress={handleCopyLink}
              style={dynamicStyles.drawerItem}
              accessibilityRole="button"
            >
              <Text style={dynamicStyles.drawerText}>Copy Link</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleToggleTheme}
            style={dynamicStyles.drawerItem}
            accessibilityRole="button"
          >
            <Text style={dynamicStyles.drawerText}>
              {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wordmarkWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline'
  }
})
