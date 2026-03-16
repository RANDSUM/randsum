import { Box, Text, render, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useMemo, useRef, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation, validateNotation } from '@randsum/roller/validate'
import { tokenize } from '@randsum/roller/tokenize'
import { NotationReference } from './components/NotationReference'
import { openInStackblitz } from './helpers/openInStackblitz'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { NotationHighlight } from './components/NotationHighlight'
import { RollResultPanel } from './components/RollResultPanel'
import { HeroBanner } from './components/HeroBanner'
import { Spinner } from './components/Spinner'
import { useCursorPosition } from './hooks/useCursorPosition'
import type { ModifierDoc } from '@randsum/display-utils'
import type { GridPosition } from './helpers/modifierGrid'

type FocusZone = 'input' | 'reference' | 'roll' | 'description' | 'banner' | 'stackblitz'

function App(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const [lastResult, setLastResult] = useState<{
    readonly records: readonly RollRecord[]
    readonly notation: string
  } | null>(null)
  const [descSelTokenIdx, setDescSelTokenIdx] = useState<number | undefined>(undefined)
  const [cursorPos, setCursorPos] = useState(0)
  const [activeDoc, setActiveDoc] = useState<ModifierDoc | undefined>(undefined)
  const [bannerItemIdx, setBannerItemIdx] = useState<0 | 1 | 2>(0)
  const [refSelectedPos, setRefSelectedPos] = useState<GridPosition>({ row: 0, col: 0 })
  const [preFocusBeforeRoll, setPreFocusBeforeRoll] = useState<FocusZone>('input')
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rollingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const tokens = useMemo(() => tokenize(input), [input])
  const isValid = input.trim().length > 0 && isDiceNotation(input.trim())
  const isInvalid = input.trim().length > 0 && !isValid

  const { activeTokenIdx } = useCursorPosition(
    input,
    tokens,
    focus === 'input',
    cursorPos,
    setCursorPos,
    () => {
      if (isValid) setFocus('roll')
    }
  )

  const showHighlight = input.trim().length > 0 || focus === 'description'

  const highlightTokenIdx: number | undefined =
    focus === 'description'
      ? isInvalid
        ? -1
        : descSelTokenIdx
      : activeTokenIdx >= 0
        ? activeTokenIdx
        : undefined

  useInput((_input, key) => {
    // When NotationHighlight replaces TextInput, handle editing manually
    if (focus === 'input' && (isValid || isInvalid)) {
      if (key.return) {
        handleSubmit(input)
        return
      }
      if (key.backspace || key.delete) {
        if (cursorPos === 0) return
        setInput(input.slice(0, cursorPos - 1) + input.slice(cursorPos))
        setCursorPos(p => Math.max(0, p - 1))
        return
      }
      if (_input && !key.ctrl && !key.meta && !key.tab) {
        setInput(input.slice(0, cursorPos) + _input + input.slice(cursorPos))
        setCursorPos(p => p + 1)
        return
      }
    }

    if (rolling) return

    if (focus === 'roll') {
      if (key.return) {
        handleSubmit(input)
      } else if (key.rightArrow || _input === 'i') {
        setFocus('input')
      } else if (key.downArrow) {
        setFocus('reference')
      } else if (_input && !key.ctrl && !key.meta && !key.tab) {
        setInput(prev => prev + _input)
        setCursorPos(input.length + 1)
        setFocus('input')
      }
      return
    }

    if (key.tab) {
      setFocus(prev => {
        if (prev === 'input' || prev === 'description' || prev === 'banner') return 'reference'
        if (prev === 'reference') return 'stackblitz'
        return 'input'
      })
    }
    if (key.return && focus === 'stackblitz') {
      const trimmed = input.trim()
      openInStackblitz(trimmed.length > 0 ? trimmed : '4d6')
      return
    }
    if (key.return && focus === 'description' && isValid) {
      handleSubmit(input)
      return
    }
    if (key.downArrow && focus === 'input') {
      setFocus('description')
    }
    if (key.downArrow && focus === 'description') {
      setFocus('reference')
    }
    if (key.upArrow && focus === 'description') {
      setFocus('input')
    }
    if (key.upArrow && focus === 'input') {
      setFocus('banner')
    }
    if (key.escape) {
      if (focus === 'banner') {
        setFocus('input')
      } else {
        if (focus === 'description') {
          setInput('')
          setCursorPos(0)
          setFocus('input')
        }
        const hadResult = lastResult !== null
        setLastResult(null)
        setActiveDoc(undefined)
        if (hadResult) {
          setFocus(preFocusBeforeRoll)
        }
      }
    }
    if (key.upArrow && focus === 'stackblitz') {
      setFocus('reference')
    }
    if (
      _input === 'i' &&
      (focus === 'reference' || focus === 'description' || focus === 'stackblitz')
    ) {
      setFocus('input')
    }
  })

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim()
    if (trimmed === '') return
    const validation = validateNotation(trimmed)
    if (!validation.valid) return
    setPreFocusBeforeRoll(focus)
    setLastResult(null)
    setActiveDoc(undefined)
    setRolling(true)
    setFocus('input')
    setCursorPos(value.length)
    if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current)
    rollingTimerRef.current = setTimeout(() => {
      try {
        const result = roll(...validation.notation)
        setLastResult({ records: result.rolls, notation: value.trim() })
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown roll error')
      } finally {
        setRolling(false)
      }
    }, 400)
  }

  const handleInputChange = (value: string): void => {
    setError(null)
    setInput(value)
    setCursorPos(value.length)
    const nowValid = value.trim().length > 0 && isDiceNotation(value.trim())
    if (!nowValid && (focus === 'roll' || focus === 'description')) setFocus('input')
  }

  const handleAddModifier = (notation: string): void => {
    const newInput = input + notation
    setInput(newInput)
    setCursorPos(newInput.length)
    setFocus('input')
  }

  const handleDocChange = (doc: ModifierDoc | undefined): void => {
    if (doc === undefined) return
    setActiveDoc(doc)
    setLastResult(null)
  }

  const enterLabel =
    focus === 'stackblitz'
      ? 'Open'
      : focus === 'banner'
        ? bannerItemIdx === 0
          ? 'Roll'
          : 'Open'
        : focus === 'reference'
          ? 'Inspect'
          : focus === 'description' && input.trim().length === 0
            ? 'Insert'
            : focus === 'description' && isValid
              ? 'Roll'
              : focus === 'description'
                ? ''
                : 'Roll'

  const addModifierActive = focus === 'reference'
  const hasInput = input.trim().length > 0
  const inClearZone = (focus === 'roll' || focus === 'description') && hasInput
  const escActive =
    focus === 'banner' || inClearZone || lastResult !== null || activeDoc !== undefined
  const escLabel = inClearZone ? 'Clear' : 'Cancel'

  return (
    <Box flexDirection="column">
      {/* Hero banner */}
      <HeroBanner
        isFocused={focus === 'banner'}
        onDown={() => {
          setFocus('input')
        }}
        onExit={() => {
          setFocus('input')
        }}
        onSelectionChange={setBannerItemIdx}
        onNotationChange={notation => {
          handleInputChange(notation)
        }}
      />

      {/* Hints */}
      <Box justifyContent="space-between">
        <Box paddingX={1}>
          <Text dimColor>↑↓←→: Navigate</Text>
        </Box>
        <Box paddingX={1}>
          <Text dimColor>Tab: Cycle Sections</Text>
        </Box>
        <Box paddingX={1}>
          <Text {...(enterLabel === '' ? { color: '#555555' as string } : {})} dimColor>
            Enter: {enterLabel}
          </Text>
        </Box>
        <Box paddingX={1}>
          <Text
            {...(!addModifierActive ? { color: '#555555' as string } : {})}
            dimColor={addModifierActive}
          >
            a: Add Modifier
          </Text>
        </Box>
        <Box paddingX={1}>
          <Text {...(!escActive ? { color: '#555555' as string } : {})} dimColor>
            Esc: {escLabel}
          </Text>
        </Box>
        <Box paddingX={1}>
          <Text dimColor>Ctrl+C: Quit</Text>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
        {/* Roll input */}
        <Box borderStyle="single" borderColor={isInvalid ? 'red' : '#888888'} paddingX={1}>
          <Text color={isValid ? 'yellow' : 'gray'} bold inverse={focus === 'roll'}>
            roll
          </Text>
          <Text dimColor>(</Text>
          {showHighlight ? (
            <NotationHighlight
              input={input}
              tokens={tokens}
              cursorPos={cursorPos}
              showCursor={focus === 'input'}
              dimAll={isInvalid && focus !== 'description'}
              {...(isInvalid && focus === 'description' ? { highlightColor: 'red' } : {})}
              {...(highlightTokenIdx !== undefined ? { activeTokenIdx: highlightTokenIdx } : {})}
            />
          ) : (
            <TextInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              focus={focus === 'input'}
              placeholder="4d6L"
            />
          )}
          <Text dimColor>)</Text>
        </Box>

        {/* Description — always shown */}
        <Box borderStyle="single" borderTop={false} borderColor="#888888" paddingX={1}>
          <NotationDescriptionRow
            tokens={tokens}
            isEmpty={input.trim().length === 0}
            isInvalid={isInvalid}
            activeTokenIdx={activeTokenIdx}
            isFocused={focus === 'description'}
            onSelectExample={example => {
              handleInputChange(example)
            }}
            onSelectionChange={tokenIdx => {
              setDescSelTokenIdx(tokenIdx)
            }}
          />
        </Box>

        {/* Shared panel: loading > modifier doc > roll result > reference (default) */}
        {rolling ? (
          <Box justifyContent="center">
            <Spinner />
          </Box>
        ) : error !== null ? (
          <Box borderStyle="single" borderColor="red" paddingX={1}>
            <Text color="red">Error: {error}</Text>
          </Box>
        ) : activeDoc !== undefined ? (
          <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
            <Text bold color="cyan">
              {activeDoc.title}
            </Text>
            <Text dimColor>{activeDoc.description}</Text>
            {activeDoc.forms.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                {activeDoc.forms.map((form, i) => (
                  <Box key={i} gap={2}>
                    <Text color="yellow">{form.notation}</Text>
                    <Text dimColor>{form.note}</Text>
                  </Box>
                ))}
              </Box>
            )}
            {activeDoc.comparisons !== undefined && activeDoc.comparisons.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                {activeDoc.comparisons.map((comp, i) => (
                  <Box key={i} gap={2}>
                    <Text color="yellow">{comp.operator}</Text>
                    <Text dimColor>{comp.note}</Text>
                  </Box>
                ))}
              </Box>
            )}
            {activeDoc.examples.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text dimColor bold>
                  Examples
                </Text>
                {activeDoc.examples.map((ex, i) => (
                  <Box key={i} gap={2}>
                    <Text color="green">{ex.notation}</Text>
                    <Text dimColor>{ex.description}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : lastResult !== null ? (
          <RollResultPanel records={lastResult.records} notation={lastResult.notation} />
        ) : (
          <NotationReference
            active={focus === 'reference'}
            modifiersDisabled={!isValid}
            onAddModifier={handleAddModifier}
            onTopExit={() => {
              setFocus('description')
            }}
            onBottomExit={() => {
              setFocus('stackblitz')
            }}
            onDocChange={handleDocChange}
            selectedPos={refSelectedPos}
            onSelectedPosChange={setRefSelectedPos}
          />
        )}
      </Box>

      {/* StackBlitz button — outside cyan border, right-aligned */}
      <Box justifyContent="flex-end">
        <Box
          borderStyle="single"
          borderColor={focus === 'stackblitz' ? 'white' : '#444444'}
          paddingX={1}
        >
          <Text bold color={focus === 'stackblitz' ? 'yellowBright' : 'gray'}>
            ⚡
          </Text>
          <Text color={focus === 'stackblitz' ? 'white' : '#555555'}> Edit In StackBlitz</Text>
        </Box>
      </Box>
    </Box>
  )
}

export function launchTui(): void {
  if (!process.stdin.isTTY) {
    console.error(
      'Interactive mode requires a TTY. Run directly: cd apps/cli && bun run src/index.ts -i'
    )
    process.exit(1)
  }
  render(<App />)
}
