import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import type { RollTemplate } from '../lib/types'
import { useTheme } from '../hooks/useTheme'

interface TemplateRowProps {
  readonly template: RollTemplate
  readonly onQuickRoll: (template: RollTemplate) => void
  readonly onDelete: (id: string) => void
  readonly onShare?: (template: RollTemplate) => void
}

export function TemplateRow({
  template,
  onQuickRoll,
  onDelete,
  onShare
}: TemplateRowProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.surface,
          borderColor: 'rgba(168, 85, 247, 0.12)',
          borderTopColor: 'rgba(168, 85, 247, 0.25)'
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: tokens.text, fontSize: fontSizes.base }]}>
          {template.name}
        </Text>
        <Text style={[styles.notation, { color: tokens.textMuted, fontSize: fontSizes.sm }]}>
          {template.notation}
        </Text>
        {variableCount > 0 && (
          <Text style={[styles.variableCount, { color: tokens.textDim, fontSize: fontSizes.xs }]}>
            {variableCount} variable{variableCount > 1 ? 's' : ''}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: tokens.surfaceAlt }]}
            onPress={() => onShare?.(template)}
            accessibilityLabel={`Share ${template.name}`}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: tokens.text, fontSize: fontSizes.sm }]}>
              Share
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: tokens.error }]}
            onPress={handleDelete}
            accessibilityLabel={`Delete ${template.name}`}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: tokens.text, fontSize: fontSizes.sm }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        style={[styles.quickRollButton, { backgroundColor: tokens.accent }]}
        onPress={() => onQuickRoll(template)}
        accessibilityLabel={`Roll ${template.name}`}
        accessibilityHint="Tap to roll this template"
        accessibilityRole="button"
      >
        <Text style={[styles.quickRollText, { color: '#ffffff', fontSize: fontSizes.lg }]}>
          {'>'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderTopWidth: 2,
    padding: 12,
    marginBottom: 8
  },
  content: {
    flex: 1,
    marginRight: 12
  },
  name: {
    fontWeight: '600'
  },
  notation: {
    fontFamily: 'JetBrainsMono_400Regular',
    marginTop: 2
  },
  variableCount: {
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  actionText: {
    fontFamily: 'JetBrainsMono_400Regular'
  },
  quickRollButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickRollText: {
    fontWeight: '700',
    fontFamily: 'JetBrainsMono_400Regular'
  }
})
