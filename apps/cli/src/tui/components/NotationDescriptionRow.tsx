import { Box, Text } from 'ink'
import type { Token } from '../helpers/tokenize'

// Token type → Ink color mapping
const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'cyan',
  dropLowest: 'yellow',
  dropHighest: 'yellow',
  keepHighest: 'green',
  keepLowest: 'green',
  explode: 'magenta',
  compound: 'magenta',
  penetrate: 'magenta',
  reroll: 'blue',
  cap: 'blue',
  replace: 'blue',
  unique: 'blue',
  countSuccesses: 'green',
  dropCondition: 'yellow',
  plus: 'cyan',
  minus: 'cyan',
  multiply: 'cyan',
  multiplyTotal: 'cyan',
  unknown: 'gray'
}

export function NotationDescriptionRow({
  notation,
  tokens,
  isValid
}: {
  readonly notation: string
  readonly tokens: readonly Token[]
  readonly isValid: boolean
}): React.JSX.Element {
  if (notation.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Try: 4d6L, 1d20+5, 2d8!</Text>
      </Box>
    )
  }

  if (!isValid) {
    return (
      <Box paddingX={1}>
        <Text color="red" dimColor>
          Invalid notation
        </Text>
      </Box>
    )
  }

  const described = tokens.filter(t => Boolean(t.description))

  return (
    <Box paddingX={1} flexWrap="wrap">
      {described.map((token, i) => {
        const sep =
          i === 0
            ? null
            : token.type === 'core'
              ? token.text.startsWith('-')
                ? ' − '
                : ' + '
              : ', '
        const color = TOKEN_COLORS[token.type] ?? 'gray'
        return (
          <Box key={`${token.type}-${token.start}`} flexDirection="row">
            {sep !== null && <Text dimColor>{sep}</Text>}
            <Text color={color}>{token.description}</Text>
          </Box>
        )
      })}
    </Box>
  )
}
