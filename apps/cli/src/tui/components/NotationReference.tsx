// SYNC: packages/component-library/src/components/ModifierReference/ModifierReference.tsx
import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { useTerminalWidth } from '../hooks/useTerminalWidth'

const TWO_COL_THRESHOLD = 80
import type { GridPosition } from '../helpers/modifierGrid'
import { navigateGrid } from '../helpers/modifierGrid'
import { MODIFIER_DOCS } from '@randsum/roller/docs'
import type { ModifierDoc } from '@randsum/roller/docs'

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
  onAddModifier,
  onTopExit,
  onBottomExit,
  onDocChange,
  selectedPos,
  onSelectedPosChange
}: {
  readonly active: boolean
  readonly modifiersDisabled: boolean
  readonly onAddModifier: (notation: string) => void
  readonly onTopExit?: () => void
  readonly onBottomExit?: () => void
  readonly onDocChange?: (doc: ModifierDoc | undefined) => void
  readonly selectedPos: GridPosition
  readonly onSelectedPosChange: (pos: GridPosition) => void
}): React.JSX.Element {
  const [showDoc, setShowDoc] = useState(false)

  const selectedRow = GRID_ROWS[selectedPos.row]
  const selectedCell =
    selectedRow !== undefined
      ? selectedPos.col === 0
        ? selectedRow[0]
        : selectedRow[1]
      : undefined
  const selectedDoc = selectedCell !== undefined ? MODIFIER_DOCS[selectedCell.notation] : undefined

  useInput(
    (_input, key) => {
      if (key.upArrow) {
        if (selectedPos.row === 0) {
          onTopExit?.()
        } else {
          onSelectedPosChange(navigateGrid(selectedPos, 'up', GRID_ROWS.length))
          setShowDoc(false)
          onDocChange?.(undefined)
        }
      } else if (key.downArrow) {
        if (selectedPos.row === GRID_ROWS.length - 1) {
          onBottomExit?.()
        } else {
          onSelectedPosChange(navigateGrid(selectedPos, 'down', GRID_ROWS.length))
          setShowDoc(false)
          onDocChange?.(undefined)
        }
      } else if (key.leftArrow) {
        onSelectedPosChange(navigateGrid(selectedPos, 'left', GRID_ROWS.length))
        setShowDoc(false)
        onDocChange?.(undefined)
      } else if (key.rightArrow) {
        onSelectedPosChange(navigateGrid(selectedPos, 'right', GRID_ROWS.length))
        setShowDoc(false)
        onDocChange?.(undefined)
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
          onDocChange?.(undefined)
        } else {
          setShowDoc(true)
          onDocChange?.(selectedDoc)
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

  const termWidth = useTerminalWidth()
  const twoCol = termWidth >= TWO_COL_THRESHOLD

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column">
        {GRID_ROWS.map((row, rowIdx) => {
          const left = row[0]
          const right = row[1]
          const isCore = rowIdx === 0
          const leftSelected = active && selectedPos.row === rowIdx && selectedPos.col === 0
          const rightSelected = active && selectedPos.row === rowIdx && selectedPos.col === 1
          const leftDisabled = modifiersDisabled && !isCore && !leftSelected
          const rightDisabled = modifiersDisabled && !rightSelected
          const leftBg = isCore ? '#2a3232' : rowIdx % 2 === 0 ? '#262626' : undefined
          const rightBg = rowIdx % 2 === 1 ? '#262626' : undefined
          const leftKeyColor = leftSelected ? 'yellowBright' : leftDisabled ? 'gray' : 'white'
          const rightKeyColor = rightSelected ? 'yellowBright' : rightDisabled ? 'gray' : 'white'

          return (
            <Box key={rowIdx} flexDirection={twoCol ? 'row' : 'column'}>
              {/* Left cell: bold notation + description */}
              <Box
                gap={1}
                width={twoCol ? '50%' : '100%'}
                paddingX={1}
                borderStyle="single"
                borderTop={rowIdx === 0}
                borderRight={twoCol ? false : undefined}
                borderColor={leftSelected ? 'white' : leftDisabled ? '#888888' : '#c0c0c0'}
                {...(leftBg !== undefined ? { backgroundColor: leftBg } : {})}
              >
                <Text bold color={leftKeyColor}>
                  {left.notation}
                  {'notationSuffix' in left ? <Text dimColor>{left.notationSuffix}</Text> : ''}
                </Text>
                <Text dimColor={!leftSelected}>{left.description}</Text>
              </Box>

              {/* Right cell: description + bold notation (mirrored) */}
              <Box
                gap={1}
                justifyContent={twoCol ? 'flex-end' : 'space-between'}
                width={twoCol ? '50%' : '100%'}
                paddingX={1}
                borderStyle="single"
                borderTop={twoCol ? rowIdx === 0 : false}
                borderColor={rightSelected ? 'white' : rightDisabled ? '#888888' : '#c0c0c0'}
                {...(rightBg !== undefined ? { backgroundColor: rightBg } : {})}
              >
                <Text dimColor={!rightSelected}>{right.description}</Text>
                <Text bold color={rightKeyColor}>
                  {right.notation}
                  {'notationSuffix' in right ? <Text dimColor>{right.notationSuffix}</Text> : ''}
                </Text>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
