import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

const DICE = [4, 6, 8, 10, 12, 20, 100] as const

interface DiceToolbarProps {
  readonly active: boolean
  readonly onSelect: (notation: string) => void
}

export function DiceToolbar({ active, onSelect }: DiceToolbarProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useInput(
    (_input, key) => {
      if (!active) return

      if (key.leftArrow) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : DICE.length - 1))
      } else if (key.rightArrow) {
        setSelectedIndex(prev => (prev < DICE.length - 1 ? prev + 1 : 0))
      } else if (key.return) {
        const die = DICE[selectedIndex]
        if (die !== undefined) {
          onSelect(`1d${die}`)
        }
      }
    },
    { isActive: active }
  )

  return (
    <Box paddingX={1} gap={1}>
      {DICE.map((die, i) => {
        const isSelected = active && i === selectedIndex
        return (
          <Box
            key={die}
            borderStyle="round"
            borderColor={isSelected ? 'cyan' : 'gray'}
            paddingX={1}
          >
            <Text bold={isSelected} color={isSelected ? 'cyan' : 'white'}>
              d{die}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
