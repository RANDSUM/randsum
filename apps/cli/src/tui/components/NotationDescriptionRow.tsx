import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useEffect, useState } from 'react'
import type { Token } from '@randsum/notation'
import { TOKEN_COLORS } from '../helpers/tokenColors'

const EXAMPLES = ['4d6L', '1d20+5', '2d12+1d6', '4d6LR{<3}!C{>5}+2d8!UR{1}C{<2,>7}+1d12V{12=10}-3']

export function NotationDescriptionRow({
  tokens,
  isEmpty = false,
  isInvalid = false,
  activeTokenIdx = -1,
  isFocused = false,
  onSelectExample,
  onSelectionChange
}: {
  readonly tokens: readonly Token[]
  readonly isEmpty?: boolean
  readonly isInvalid?: boolean
  readonly activeTokenIdx?: number
  readonly isFocused?: boolean
  readonly onSelectExample?: (example: string) => void
  readonly onSelectionChange?: (tokenIdx: number) => void
}): React.JSX.Element {
  const [selectedExample, setSelectedExample] = useState(0)
  const [selectedDescIdx, setSelectedDescIdx] = useState(0)

  const described = tokens.filter(t => Boolean(t.description))
  const describedWithIdx = described.map(t => ({
    token: t,
    tokenIdx: tokens.indexOf(t)
  }))

  // Report selection when description is focused
  useEffect(() => {
    if (isFocused && !isEmpty && !isInvalid) {
      const entry = describedWithIdx[selectedDescIdx]
      if (entry !== undefined) onSelectionChange?.(entry.tokenIdx)
    }
  }, [isFocused, selectedDescIdx, isEmpty, isInvalid])

  useInput(
    (_input, key) => {
      if (key.leftArrow) {
        setSelectedExample(prev => Math.max(0, prev - 1))
      } else if (key.rightArrow) {
        setSelectedExample(prev => Math.min(EXAMPLES.length - 1, prev + 1))
      } else if (key.return) {
        const ex = EXAMPLES[selectedExample]
        if (ex !== undefined) onSelectExample?.(ex)
      }
    },
    { isActive: isEmpty && isFocused }
  )

  useInput(
    (_input, key) => {
      if (key.leftArrow) {
        setSelectedDescIdx(prev => Math.max(0, prev - 1))
      } else if (key.rightArrow) {
        setSelectedDescIdx(prev => Math.min(describedWithIdx.length - 1, prev + 1))
      }
    },
    { isActive: !isEmpty && !isInvalid && isFocused }
  )

  if (isInvalid) {
    return (
      <Box backgroundColor="red" paddingX={1} width="100%">
        <Text color="white" bold>
          Invalid notation
        </Text>
      </Box>
    )
  }

  if (isEmpty) {
    return (
      <Box>
        <Text dimColor>Try: </Text>
        {EXAMPLES.map((ex, i) => {
          const isSelected = isFocused && i === selectedExample
          return (
            <Box key={ex} flexDirection="row">
              {i > 0 && <Text dimColor>, </Text>}
              <Text color="yellow" bold={isSelected} inverse={isSelected}>
                {ex}
              </Text>
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <Box flexWrap="wrap">
      {describedWithIdx.map(({ token, tokenIdx }, i) => {
        const sep =
          i === 0
            ? null
            : token.type === 'core'
              ? token.text.startsWith('-')
                ? ' − '
                : ' + '
              : ', '
        const color = TOKEN_COLORS[token.type] ?? 'gray'
        const isActive = isFocused ? i === selectedDescIdx : tokenIdx === activeTokenIdx
        return (
          <Box key={`${token.type}-${token.start}`} flexDirection="row">
            {sep !== null && <Text dimColor>{sep}</Text>}
            <Text color={color} bold={isActive} inverse={isActive}>
              {token.description}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
