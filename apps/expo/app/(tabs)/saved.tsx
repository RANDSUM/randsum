import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

import { TemplateRow } from '../../components/TemplateRow'
import { VariablePromptSheet } from '../../components/VariablePromptSheet'
import type { DiceNotation } from '@randsum/roller'

import { useRoll } from '../../hooks/useRoll'
import { useTemplates } from '../../hooks/useTemplates'
import { useTheme } from '../../hooks/useTheme'
import { interpolateNotation } from '../../lib/interpolate'
import { shareTemplate } from '../../lib/sharing'
import type { RollTemplate } from '../../lib/types'

export default function SavedScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const router = useRouter()
  const { templates, isLoading, deleteTemplate } = useTemplates()
  const [variableTemplate, setVariableTemplate] = useState<RollTemplate | null>(null)
  const { roll } = useRoll({
    templateId: variableTemplate?.id
  })

  const handleQuickRoll = useCallback(
    (template: RollTemplate) => {
      if (template.variables.length > 0) {
        setVariableTemplate(template)
      } else {
        roll(template.notation as DiceNotation)
      }
    },
    [roll]
  )

  const handleVariableRoll = useCallback(
    (values: Record<string, number>) => {
      if (!variableTemplate) return
      const notation = interpolateNotation(variableTemplate.notation, values)
      roll(notation as DiceNotation)
      setVariableTemplate(null)
    },
    [variableTemplate, roll]
  )

  const handleEdit = useCallback(
    (_template: RollTemplate) => {
      router.push('/wizard')
    },
    [router]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteTemplate(id)
    },
    [deleteTemplate]
  )

  const handleShare = useCallback((template: RollTemplate) => {
    shareTemplate(template, `https://randsum.io/t/${template.id}`)
  }, [])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg
    },
    list: {
      padding: 16
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32
    },
    emptyText: {
      color: tokens.textMuted,
      fontSize: fontSizes.base,
      textAlign: 'center'
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.bg
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center'
    },
    fabText: {
      color: tokens.text,
      fontSize: fontSizes['2xl'],
      fontWeight: '300',
      lineHeight: 34
    }
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={tokens.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TemplateRow
            template={item}
            onQuickRoll={handleQuickRoll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved rolls. Tap + to create one.</Text>
          </View>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/wizard')}
        accessibilityLabel="Create new template"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <VariablePromptSheet
        variables={variableTemplate?.variables ?? []}
        isVisible={variableTemplate !== null}
        onRoll={handleVariableRoll}
        onDismiss={() => setVariableTemplate(null)}
      />
    </View>
  )
}
