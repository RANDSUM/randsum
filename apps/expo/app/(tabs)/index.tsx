import type { RollArgument } from '@randsum/roller'
import { NotationRoller, QuickReferenceGrid } from '@randsum/dice-ui'
import type { RollResult } from '@randsum/dice-ui'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DiceGrid } from '../../components/DiceGrid'
import { RollButton } from '../../components/RollButton'
import { useRoll } from '../../hooks/useRoll'
import { useTemplates } from '../../hooks/useTemplates'
import { useTheme } from '../../hooks/useTheme'
import { generateId } from '../../lib/generateId'
import { useContentTabStore } from '../../lib/stores/contentTabStore'
import { useNotationStore } from '../../lib/stores/notationStore'
import { usePoolStore } from '../../lib/stores/poolStore'

export default function RollScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const activeTab = useContentTabStore(s => s.tab)
  const { saveTemplate } = useTemplates()

  const clearPool = usePoolStore(s => s.clear)

  const notation = useNotationStore(s => s.notation)
  const isValid = useNotationStore(s => s.isValid)
  const setNotation = useNotationStore(s => s.setNotation)
  const clearNotation = useNotationStore(s => s.clear)

  const { roll } = useRoll()

  function handleRoll(): void {
    if (!isValid) return
    roll(notation as RollArgument)
  }

  function handleRollerRoll(result: RollResult): void {
    roll(result.notation as RollArgument)
  }

  function handleDiePress(sides: number): void {
    const fragment = notation.length > 0 ? `+1d${sides}` : `1d${sides}`
    setNotation(notation + fragment)
  }

  function handlePercentilePress(): void {
    const fragment = notation.length > 0 ? '+1d%' : '1d%'
    setNotation(notation + fragment)
  }

  function handleClear(): void {
    clearPool()
    clearNotation()
  }

  function handleSave(): void {
    if (!isValid) return
    void saveTemplate({
      id: generateId(),
      name: notation,
      notation,
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  function handleAppendNotation(fragment: string): void {
    setNotation(notation + fragment)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <View style={styles.container}>
        <View style={styles.inputArea}>
          <NotationRoller
            notation={notation}
            onChange={setNotation}
            onRoll={handleRollerRoll}
            showRollButton={false}
          />
        </View>

        <View style={styles.contentArea}>
          {activeTab === 'common' ? (
            <View style={styles.diceGridWrap}>
              <DiceGrid onDiePress={handleDiePress} onPercentilePress={handlePercentilePress} />
            </View>
          ) : (
            <QuickReferenceGrid onAdd={handleAppendNotation} notation={notation} />
          )}
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[
                styles.secondaryButton,
                {
                  borderColor: isValid ? 'rgba(168, 85, 247, 0.3)' : tokens.border,
                  opacity: isValid ? 1 : 0.4
                }
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save as template"
            >
              <Text
                style={[styles.secondaryLabel, { color: tokens.text, fontSize: fontSizes.base }]}
              >
                Save
              </Text>
            </Pressable>
            <Pressable
              onPress={handleClear}
              style={[styles.secondaryButton, { borderColor: tokens.border }]}
              accessibilityRole="button"
              accessibilityLabel="Clear notation"
            >
              <Text
                style={[styles.secondaryLabel, { color: tokens.text, fontSize: fontSizes.base }]}
              >
                Clear
              </Text>
            </Pressable>
          </View>
          <RollButton enabled={isValid} onPress={handleRoll} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  inputArea: {
    paddingTop: 8,
    paddingBottom: 4
  },
  contentArea: {
    flex: 1
  },
  diceGridWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomBar: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10
  },
  secondaryLabel: {
    fontWeight: '500',
    fontFamily: 'JetBrainsMono_400Regular'
  }
})
