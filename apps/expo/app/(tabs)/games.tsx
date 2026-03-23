import { useCallback, useState } from 'react'
import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'

import { GameCard } from '../../components/GameCard'
import { GameRoller } from '../../components/GameRoller'
import { RollButton } from '../../components/RollButton'
import { useGameRoll } from '../../hooks/useGameRoll'
import { useTheme } from '../../hooks/useTheme'
import type { SupportedGameId } from '../../lib/gameConfig'
import { GAME_CONFIG, GAME_LIST } from '../../lib/gameConfig'
import { GAME_INPUT_SPECS } from '../../lib/gameInputSpecs'

function GameSelector({
  onSelect
}: {
  readonly onSelect: (id: SupportedGameId) => void
}): React.JSX.Element {
  const { tokens } = useTheme()

  const renderItem = useCallback(
    ({ item }: { readonly item: (typeof GAME_LIST)[number] }) => (
      <View style={styles.cardCell}>
        <GameCard
          name={item.name}
          description={item.description}
          accentColor={item.color}
          onPress={() => onSelect(item.shortcode)}
        />
      </View>
    ),
    [onSelect]
  )

  return (
    <FlatList
      data={GAME_LIST}
      renderItem={renderItem}
      keyExtractor={item => item.shortcode}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.listContent, { backgroundColor: tokens.bg }]}
    />
  )
}

function GameRollerScreen({
  gameId,
  onBack
}: {
  readonly gameId: SupportedGameId
  readonly onBack: () => void
}): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const config = GAME_CONFIG[gameId]
  const { roll } = useGameRoll(gameId)
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const specs = GAME_INPUT_SPECS[gameId]
    const defaults: Record<string, unknown> = {}
    for (const spec of specs) {
      if (spec.defaultValue !== undefined) {
        defaults[spec.name] = spec.defaultValue
      }
    }
    return defaults
  })

  function handleChange(name: string, value: unknown): void {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  function handleRoll(): void {
    // Filter out undefined optional values
    const cleanInputs: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(values)) {
      if (val !== undefined) {
        cleanInputs[key] = val
      }
    }
    roll(cleanInputs)
  }

  return (
    <View style={[styles.rollerContainer, { backgroundColor: tokens.bg }]}>
      <View style={styles.rollerHeader}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to games"
          style={styles.backButton}
        >
          <Text style={{ color: tokens.accent, fontSize: fontSizes.base }}>Back</Text>
        </Pressable>
        <Text
          style={[
            styles.rollerTitle,
            { color: config.color, fontSize: fontSizes.lg, fontWeight: '600' }
          ]}
        >
          {config.name}
        </Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView
        style={styles.rollerScroll}
        contentContainerStyle={styles.rollerScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GameRoller gameId={gameId} values={values} onChange={handleChange} />
      </ScrollView>
      <View style={styles.rollerBottom}>
        <RollButton enabled onPress={handleRoll} />
      </View>
    </View>
  )
}

export default function GamesScreen(): React.JSX.Element {
  const { tokens } = useTheme()
  const [selectedGame, setSelectedGame] = useState<SupportedGameId | null>(null)

  if (selectedGame !== null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
        <GameRollerScreen gameId={selectedGame} onBack={() => setSelectedGame(null)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <GameSelector onSelect={setSelectedGame} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  listContent: {
    padding: 12,
    gap: 12
  },
  row: {
    gap: 12
  },
  cardCell: {
    flex: 1
  },
  rollerContainer: {
    flex: 1
  },
  rollerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center'
  },
  rollerTitle: {
    flex: 1,
    textAlign: 'center'
  },
  rollerScroll: {
    flex: 1
  },
  rollerScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  rollerBottom: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 12
  }
})
