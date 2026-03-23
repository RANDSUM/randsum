import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'

import { useAuth } from '../../hooks/useAuth'
import { useSync } from '../../hooks/useSync'
import { useTheme } from '../../hooks/useTheme'
import { storage } from '../../lib/storage'
import { useThemeStore } from '../../lib/stores/themeStore'

export default function AccountScreen(): React.JSX.Element {
  const { tokens, fontSizes, colorScheme } = useTheme()
  const toggleTheme = useThemeStore(s => s.toggleTheme)
  const { user, isLoading, signIn, signUp, signOut } = useAuth()
  const { status: syncStatus, lastSyncAt, errorMessage: syncError, triggerSync } = useSync()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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
      marginBottom: 24
    },
    section: {
      backgroundColor: tokens.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: tokens.border
    },
    sectionTitle: {
      color: tokens.textMuted,
      fontSize: fontSizes.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12
    },
    input: {
      backgroundColor: tokens.surfaceAlt,
      color: tokens.text,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: fontSizes.base,
      marginBottom: 10
    },
    button: {
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 8
    },
    primaryButton: {
      backgroundColor: tokens.accent
    },
    secondaryButton: {
      backgroundColor: tokens.surfaceAlt,
      borderWidth: 1,
      borderColor: tokens.border
    },
    primaryButtonText: {
      color: tokens.text,
      fontSize: fontSizes.base,
      fontWeight: '600'
    },
    secondaryButtonText: {
      color: tokens.textMuted,
      fontSize: fontSizes.base
    },
    errorText: {
      color: tokens.error,
      fontSize: fontSizes.sm,
      marginBottom: 8
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
    userEmail: {
      color: tokens.text,
      fontSize: fontSizes.base,
      marginBottom: 4
    },
    userLabel: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      marginBottom: 16
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
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.bg
    }
  })

  if (isLoading && user === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={tokens.accent} />
      </View>
    )
  }

  async function handleAuth(): Promise<void> {
    setFormError(null)
    const fn = isSignUp ? signUp : signIn
    const error = await fn(email.trim(), password)
    if (error) {
      setFormError(error)
    }
  }

  async function handleSignOut(): Promise<void> {
    await signOut()
  }

  async function handleHapticsToggle(value: boolean): Promise<void> {
    setHapticsEnabled(value)
    const prefs = await storage.getPreferences()
    await storage.savePreferences({
      ...prefs,
      haptics: value,
      updatedAt: new Date().toISOString()
    })
  }

  if (user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signed In</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userLabel}>Your rolls sync across devices</Text>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleSignOut}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <Text style={styles.toggleLabel}>
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : syncStatus === 'error'
                ? `Sync error: ${syncError ?? 'Unknown error'}`
                : lastSyncAt
                  ? `Last synced: ${new Date(lastSyncAt).toLocaleString()}`
                  : 'Not yet synced'}
          </Text>
          {syncStatus === 'syncing' ? (
            <ActivityIndicator color={tokens.accent} style={{ marginTop: 8 }} />
          ) : (
            <Pressable
              style={[styles.button, styles.secondaryButton, { marginTop: 8 }]}
              onPress={() => {
                void triggerSync()
              }}
            >
              <Text style={styles.secondaryButtonText}>Sync Now</Text>
            </Pressable>
          )}
          {syncStatus === 'error' && <Text style={styles.errorText}>{syncError}</Text>}
        </View>

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
          <Text
            style={styles.link}
            onPress={() => {
              void Linking.openURL('https://randsum.dev')
            }}
          >
            randsum.dev
          </Text>
          <Text
            style={styles.link}
            onPress={() => {
              void Linking.openURL('https://notation.randsum.dev')
            }}
          >
            notation.randsum.dev
          </Text>
          <Text style={styles.versionText}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={tokens.textDim}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={tokens.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        {formError !== null && <Text style={styles.errorText}>{formError}</Text>}

        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={() => {
            void handleAuth()
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            setIsSignUp(v => !v)
            setFormError(null)
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
