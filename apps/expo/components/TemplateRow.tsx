import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import type { RollTemplate } from '../lib/types'
import { useTheme } from '../hooks/useTheme'

interface TemplateRowProps {
  readonly template: RollTemplate
  readonly onQuickRoll: (template: RollTemplate) => void
  readonly onEdit: (template: RollTemplate) => void
  readonly onDelete: (id: string) => void
  readonly onShare?: (template: RollTemplate) => void
}

export function TemplateRow({
  template,
  onQuickRoll,
  onEdit,
  onDelete,
  onShare
}: TemplateRowProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8
    },
    content: {
      flex: 1,
      marginRight: 12
    },
    name: {
      color: tokens.text,
      fontSize: fontSizes.base,
      fontWeight: '600'
    },
    notation: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      fontFamily: 'JetBrainsMono_400Regular',
      marginTop: 2
    },
    variableCount: {
      color: tokens.textDim,
      fontSize: fontSizes.xs,
      marginTop: 2
    },
    quickRollButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center'
    },
    quickRollText: {
      color: tokens.text,
      fontSize: fontSizes.lg,
      fontWeight: '700'
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8
    },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 6
    },
    deleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: tokens.error,
      borderRadius: 6
    },
    actionText: {
      color: tokens.text,
      fontSize: fontSizes.sm
    }
  })

  function handleDelete(): void {
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(template.id)
      }
    ])
  }

  const variableCount = template.variables.length
  const secondaryText = template.gameId ?? template.notation

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.notation}>{secondaryText}</Text>
        {variableCount > 0 && (
          <Text style={styles.variableCount}>
            {variableCount} variable{variableCount > 1 ? 's' : ''}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable
            style={styles.editButton}
            onPress={() => onEdit(template)}
            accessibilityLabel={`Edit ${template.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.editButton}
            onPress={() => onShare?.(template)}
            accessibilityLabel={`Share ${template.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityLabel={`Delete ${template.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Delete</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        style={styles.quickRollButton}
        onPress={() => onQuickRoll(template)}
        accessibilityLabel={`Roll ${template.name}`}
        accessibilityHint="Tap to roll this template"
        accessibilityRole="button"
      >
        <Text style={styles.quickRollText}>{'>'}</Text>
      </Pressable>
    </View>
  )
}
