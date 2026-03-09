// SYNC: packages/component-library/src/components/ModifierReference/ModifierReference.tsx
import { Box, Text, useInput, useStdout } from 'ink'
import { useState } from 'react'
import type { GridPosition } from '../helpers/modifierGrid'
import { navigateGrid } from '../helpers/modifierGrid'
import { MODIFIER_DOCS } from '../helpers/modifierDocs'

interface ModifierEntry {
  readonly notation: string
  readonly description: string
  readonly notationSuffix?: string
}

const CORE: ModifierEntry = { notation: 'xDN', description: 'roll x dice with N sides' }

const GRID_ROWS = [
  [CORE, { notation: '+', description: 'add', notationSuffix: 'N' }],
  [
    { notation: 'L', description: 'drop lowest', notationSuffix: 'N' },
    { notation: '-', description: 'subtract', notationSuffix: 'N' }
  ],
  [
    { notation: 'H', description: 'drop highest', notationSuffix: 'N' },
    { notation: '*', description: 'multiply dice', notationSuffix: 'N' }
  ],
  [
    { notation: 'K', description: 'keep highest', notationSuffix: 'N' },
    { notation: '**', description: 'multiply total', notationSuffix: 'N' }
  ],
  [
    { notation: 'KL', description: 'keep lowest', notationSuffix: 'N' },
    { notation: 'V{..}', description: 'replace...' }
  ],
  [
    { notation: '!', description: 'explode' },
    { notation: 'S{..}', description: 'successes...' }
  ],
  [
    { notation: '!!', description: 'compound', notationSuffix: 'N' },
    { notation: 'D{..}', description: 'drop condition...' }
  ],
  [
    { notation: '!p', description: 'penetrate', notationSuffix: 'N' },
    { notation: 'C{..}', description: 'cap...' }
  ],
  [
    { notation: 'U', description: 'unique', notationSuffix: '{..}' },
    { notation: 'R{..}', description: 'reroll...', notationSuffix: 'N' }
  ]
] as const satisfies readonly (readonly [ModifierEntry, ModifierEntry])[]

export function NotationReference({
  active,
  modifiersDisabled,
  onAddModifier
}: {
  readonly active: boolean
  readonly modifiersDisabled: boolean
  readonly onAddModifier: (notation: string) => void
}): React.JSX.Element {
  const [selectedPos, setSelectedPos] = useState<GridPosition>({ row: 0, col: 0 })
  const [showDoc, setShowDoc] = useState(false)
  const { stdout } = useStdout()
  const separatorWidth = Math.max(10, (stdout?.columns ?? 80) - 6)

  useInput(
    (_input, key) => {
      if (key.upArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'up', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.downArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'down', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.leftArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'left', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.rightArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'right', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.return) {
        if (showDoc) {
          const row = GRID_ROWS[selectedPos.row]
          if (row === undefined) return
          const cell = selectedPos.col === 0 ? row[0] : row[1]
          const isCore = selectedPos.row === 0 && selectedPos.col === 0
          if (!modifiersDisabled || isCore) {
            onAddModifier(cell.notation)
          }
          setShowDoc(false)
        } else {
          setShowDoc(true)
        }
      } else if (_input === 'a' || _input === 'A') {
        const row = GRID_ROWS[selectedPos.row]
        if (row === undefined) return
        const cell = selectedPos.col === 0 ? row[0] : row[1]
        const isCore = selectedPos.row === 0 && selectedPos.col === 0
        if (!modifiersDisabled || isCore) {
          onAddModifier(cell.notation)
        }
      }
    },
    { isActive: active }
  )

  const selectedRow = GRID_ROWS[selectedPos.row]
  const selectedCell =
    selectedRow !== undefined
      ? selectedPos.col === 0
        ? selectedRow[0]
        : selectedRow[1]
      : undefined
  const selectedDoc = selectedCell !== undefined ? MODIFIER_DOCS[selectedCell.notation] : undefined

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {active && (
        <Box marginBottom={0}>
          <Text dimColor>arrows:navigate  Enter:details  a:add</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {GRID_ROWS.map((row, rowIdx) => {
          const left = row[0]
          const right = row[1]
          const isCore = rowIdx === 0
          const leftSelected = active && selectedPos.row === rowIdx && selectedPos.col === 0
          const rightSelected = active && selectedPos.row === rowIdx && selectedPos.col === 1
          const leftDimmed = !leftSelected && !isCore && modifiersDisabled
          const rightDimmed = !rightSelected && modifiersDisabled

          return (
            <Box key={rowIdx} flexDirection="column">
              <Box justifyContent="space-between">
                {/* Left cell: bold notation + description */}
                <Box gap={1} flexGrow={1}>
                  <Text bold {...(leftSelected ? { color: 'cyan' } : {})} dimColor={leftDimmed}>
                    {left.notation}
                    {'notationSuffix' in left ? (
                      <Text dimColor={!leftSelected}>{left.notationSuffix}</Text>
                    ) : ''}
                  </Text>
                  <Text dimColor={!leftSelected || leftDimmed}>{left.description}</Text>
                </Box>

                {/* Right cell: description + bold notation (mirrored) */}
                <Box gap={1} justifyContent="flex-end" flexGrow={1}>
                  <Text dimColor={!rightSelected || rightDimmed}>{right.description}</Text>
                  <Text bold {...(rightSelected ? { color: 'cyan' } : {})} dimColor={rightDimmed}>
                    {right.notation}
                    {'notationSuffix' in right ? (
                      <Text dimColor={!rightSelected}>{right.notationSuffix}</Text>
                    ) : ''}
                  </Text>
                </Box>
              </Box>

              {rowIdx < GRID_ROWS.length - 1 && (
                <Text dimColor>{'─'.repeat(separatorWidth)}</Text>
              )}
            </Box>
          )
        })}
      </Box>

      {showDoc && selectedDoc !== undefined && (
        <Box
          flexDirection="column"
          marginTop={1}
          borderStyle="single"
          borderColor="cyan"
          paddingX={1}
        >
          <Text bold color="cyan">
            {selectedDoc.title}
          </Text>
          <Text dimColor>{selectedDoc.description}</Text>
          {selectedDoc.forms.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {selectedDoc.forms.map((form, i) => (
                <Box key={i} gap={2}>
                  <Text color="yellow">{form.notation}</Text>
                  <Text dimColor>{form.note}</Text>
                </Box>
              ))}
            </Box>
          )}
          {selectedDoc.comparisons !== undefined && selectedDoc.comparisons.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {selectedDoc.comparisons.map((comp, i) => (
                <Box key={i} gap={2}>
                  <Text color="yellow">{comp.operator}</Text>
                  <Text dimColor>{comp.note}</Text>
                </Box>
              ))}
            </Box>
          )}
          {selectedDoc.examples.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor bold>
                Examples
              </Text>
              {selectedDoc.examples.map((ex, i) => (
                <Box key={i} gap={2}>
                  <Text color="green">{ex.notation}</Text>
                  <Text dimColor>{ex.description}</Text>
                </Box>
              ))}
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>Enter/a to add  Enter again to close</Text>
          </Box>
        </Box>
      )}

      {active && !showDoc && (
        <Box marginTop={1}>
          <Text dimColor>Enter to see modifier details</Text>
        </Box>
      )}
    </Box>
  )
}
