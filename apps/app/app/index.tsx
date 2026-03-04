import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { roll } from '@randsum/roller'
import { useNotation } from '../src/hooks/useNotation'
import { useHistory } from '../src/hooks/useHistory'
import { useSavedRolls } from '../src/hooks/useSavedRolls'
import { buildHistoryEntry } from '../src/lib/buildHistoryEntry'
import { NotationInput } from '../src/components/NotationInput'
import { DiceButtons } from '../src/components/DiceButtons'
import { ModifierButtons } from '../src/components/ModifierButtons'
import { ResultSheet } from '../src/components/ResultSheet'
import { HistoryLog } from '../src/components/HistoryLog'
import { SavedRollsSheet } from '../src/components/SavedRollsSheet'
import { NamePromptDialog } from '../src/components/NamePromptDialog'
import type { HistoryEntry } from '../src/types'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { notation, setNotation, addDie, toggleModifier, appendModifier, clear } = useNotation()
  const { history, addEntry } = useHistory()
  const { savedRolls, addSavedRoll, removeSavedRoll } = useSavedRolls()
  const [resultEntry, setResultEntry] = useState<HistoryEntry | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  const handleRoll = useCallback(() => {
    const result = roll(notation.raw)
    if (result.error) return
    const entry = buildHistoryEntry(notation.raw, result)
    addEntry(entry)
    setResultEntry(entry)
    setResultOpen(true)
  }, [notation.raw, addEntry])

  const handleRollAgain = useCallback((notationStr: string) => {
    const result = roll(notationStr)
    if (result.error) return
    const entry = buildHistoryEntry(notationStr, result)
    addEntry(entry)
    setResultEntry(entry)
  }, [addEntry])

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top} paddingBottom={insets.bottom}>

      {/* Header */}
      <XStack
        paddingHorizontal="$4" paddingVertical="$3"
        justifyContent="space-between" alignItems="center"
        borderBottomWidth={1} borderBottomColor="$borderColor"
      >
        <Text fontSize="$6" fontWeight="bold" color="$color" letterSpacing={2}>RANDSUM</Text>
        <Button
          size="$3" backgroundColor="$backgroundStrong"
          borderColor="$borderColor" borderWidth={1}
          onPress={() => setSavedOpen(true)}
        >
          <Text color="$colorMuted" fontSize="$3">Saved</Text>
        </Button>
      </XStack>

      {/* Zone 1: Notation builder */}
      <YStack gap="$4" padding="$4">
        <NotationInput notation={notation} onChange={setNotation} onClear={clear} />
        <DiceButtons onAddDie={addDie} />
        <ModifierButtons
          notation={notation.raw}
          onToggleModifier={toggleModifier}
          onAppendModifier={appendModifier}
        />
        <Button
          size="$5"
          backgroundColor={notation.isValid ? '$accent' : '$backgroundMuted'}
          disabled={!notation.isValid}
          opacity={notation.isValid ? 1 : 0.5}
          onPress={handleRoll}
          borderRadius="$4"
        >
          <Text
            color={notation.isValid ? 'white' : '$colorMuted'}
            fontSize="$5" fontWeight="bold" letterSpacing={2}
          >
            ROLL
          </Text>
        </Button>
      </YStack>

      {/* Zone 2: History */}
      <YStack flex={1} borderTopWidth={1} borderTopColor="$borderColor">
        <Text
          paddingHorizontal="$4" paddingVertical="$2"
          fontSize="$2" color="$colorMuted" letterSpacing={1}
        >
          HISTORY
        </Text>
        <HistoryLog
          history={history}
          onSelectEntry={entry => { setResultEntry(entry); setResultOpen(true) }}
        />
      </YStack>

      {/* Sheets and dialogs */}
      <ResultSheet
        entry={resultEntry}
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        onRollAgain={handleRollAgain}
        onSaveRoll={addSavedRoll}
      />
      <SavedRollsSheet
        open={savedOpen}
        savedRolls={savedRolls}
        currentNotation={notation.raw}
        isCurrentValid={notation.isValid}
        onLoad={setNotation}
        onDelete={removeSavedRoll}
        onSaveCurrent={() => setShowNamePrompt(true)}
        onClose={() => setSavedOpen(false)}
      />
      <NamePromptDialog
        open={showNamePrompt}
        onConfirm={name => addSavedRoll(name, notation.raw)}
        onClose={() => setShowNamePrompt(false)}
      />
    </YStack>
  )
}
