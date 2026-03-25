import { useCallback, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'

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

  const handleDelete = useCallback(
    (id: string) => {
      deleteTemplate(id)
    },
    [deleteTemplate]
  )

  const handleShare = useCallback((template: RollTemplate) => {
    shareTemplate(template, `https://randsum.io/t/${template.id}`)
  }, [])

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.bg }]}>
        <Text style={[styles.loadingText, { color: tokens.textDim, fontSize: fontSizes.base }]}>
          Loading...
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg }]}>
      <FlatList
        data={templates}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TemplateRow
            template={item}
            onQuickRoll={handleQuickRoll}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: tokens.textMuted, fontSize: fontSizes.base }]}>
              No saved rolls yet.{'\n'}Use the Save button on the Roll tab.
            </Text>
          </View>
        }
      />
      <VariablePromptSheet
        variables={variableTemplate?.variables ?? []}
        isVisible={variableTemplate !== null}
        onRoll={handleVariableRoll}
        onDismiss={() => setVariableTemplate(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  list: {
    padding: 16
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontFamily: 'JetBrainsMono_400Regular'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22
  }
})
