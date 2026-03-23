import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import type { Variable } from '../lib/types'
import { useTheme } from '../hooks/useTheme'

interface VariablePromptSheetProps {
  readonly variables: readonly Variable[]
  readonly isVisible: boolean
  readonly onRoll: (values: Record<string, number>) => void
  readonly onDismiss: () => void
}

export function VariablePromptSheet({
  variables,
  isVisible,
  onRoll,
  onDismiss
}: VariablePromptSheetProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const v of variables) {
      initial[v.name] = String(v.default ?? 0)
    }
    return initial
  })

  function handleValueChange(name: string, text: string): void {
    setValues(prev => ({ ...prev, [name]: text }))
  }

  function handleRoll(): void {
    const numeric: Record<string, number> = {}
    for (const v of variables) {
      const raw = values[v.name]
      const parsed = Number(raw)
      numeric[v.name] = Number.isNaN(parsed) ? (v.default ?? 0) : parsed
    }
    onRoll(numeric)
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    sheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      paddingBottom: 40
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.lg,
      fontWeight: '600',
      marginBottom: 16
    },
    field: {
      marginBottom: 12
    },
    label: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      marginBottom: 4
    },
    input: {
      backgroundColor: tokens.surfaceAlt,
      color: tokens.text,
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      borderRadius: 8,
      padding: 10,
      minHeight: 44
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16
    },
    cancelButton: {
      flex: 1,
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center'
    },
    rollButton: {
      flex: 1,
      backgroundColor: tokens.accent,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center'
    },
    buttonText: {
      color: tokens.text,
      fontSize: fontSizes.base,
      fontWeight: '600'
    }
  })

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Set Variables</Text>
          {variables.map(v => (
            <View key={v.name} style={styles.field}>
              <Text style={styles.label}>{v.label ?? v.name}</Text>
              <TextInput
                style={styles.input}
                value={values[v.name]}
                onChangeText={text => handleValueChange(v.name, text)}
                keyboardType="numeric"
                accessibilityLabel={v.label ?? v.name}
              />
            </View>
          ))}
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={onDismiss}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.rollButton}
              onPress={handleRoll}
              accessibilityLabel="Roll"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Roll</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
