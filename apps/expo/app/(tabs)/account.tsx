import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'

import { useTheme } from '../../hooks/useTheme'
import { storage } from '../../lib/storage'
import { useThemeStore } from '../../lib/stores/themeStore'

export default function SettingsScreen(): React.JSX.Element {
  const { tokens, fontSizes, colorScheme } = useTheme()
  const toggleTheme = useThemeStore(s => s.toggleTheme)

  const [hapticsEnabled, setHapticsEnabled] = useState(true)

  useEffect(() => {
    storage
      .getPreferences()
      .then(prefs => {
        setHapticsEnabled(prefs.haptics)
      })
      .catch(() => {
        // Fall back to default (true)
      })
  }, [])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg
    },
    scrollContent: {
      padding: 20
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.xl,
      fontWeight: '600',
      fontFamily: 'JetBrainsMono_400Regular',
      letterSpacing: -0.5,
      marginBottom: 24
    },
    section: {
      backgroundColor: tokens.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(168, 85, 247, 0.12)',
      borderTopWidth: 2,
      borderTopColor: 'rgba(168, 85, 247, 0.25)'
    },
    sectionTitle: {
      color: tokens.textMuted,
      fontSize: fontSizes.xs,
      fontWeight: '600',
      fontFamily: 'JetBrainsMono_400Regular',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4
    },
    toggleLabel: {
      color: tokens.text,
      fontSize: fontSizes.base
    },
    link: {
      color: tokens.accent,
      fontSize: fontSizes.base,
      paddingVertical: 8
    },
    versionText: {
      color: tokens.textDim,
      fontSize: fontSizes.xs,
      marginTop: 8
    }
  })

  async function handleHapticsToggle(value: boolean): Promise<void> {
    setHapticsEnabled(value)
    const prefs = await storage.getPreferences()
    await storage.savePreferences({
      ...prefs,
      haptics: value,
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Dark Mode</Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ true: tokens.accent }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Haptic Feedback</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={handleHapticsToggle}
            trackColor={{ true: tokens.accent }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Pressable
          onPress={() => {
            void Linking.openURL('https://randsum.dev')
          }}
        >
          <Text style={styles.link}>randsum.dev</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Linking.openURL('https://notation.randsum.dev')
          }}
        >
          <Text style={styles.link}>notation.randsum.dev</Text>
        </Pressable>
        <Text style={styles.versionText}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>
    </ScrollView>
  )
}
