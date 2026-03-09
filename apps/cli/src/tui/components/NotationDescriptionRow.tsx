import { Box, Text } from 'ink'
import type { Token } from '@randsum/notation'

/**
 * Token type → Ink color mapping.
 * Colors match the Playground CSS token families (dark mode).
 * SYNC: packages/component-library/src/components/RollerPlayground/RollerPlayground.css
 */
const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'blue',            // #60a5fa
  dropLowest: 'magenta',   // #f060d0
  dropHighest: 'magenta',  // #b858b0
  keepHighest: 'yellow',   // #ffab70
  keepLowest: 'yellow',    // #d4845a
  explode: 'yellow',       // #e5c07b
  compound: 'yellow',      // #e08040
  penetrate: 'green',      // #b8d858
  reroll: 'magenta',       // #c792ea
  cap: 'cyan',             // #89ddff
  replace: 'green',        // #c3e88d
  unique: 'cyan',          // #80cbc4
  countSuccesses: 'blue',  // #82aaff
  dropCondition: 'magenta',// #d860c0
  plus: 'green',           // #98c379
  minus: 'green',          // #6b9e52
  multiply: 'yellow',      // #ffcb6b
  multiplyTotal: 'yellow', // #e8a93a
  unknown: 'red'           // #f97583
}

export function NotationDescriptionRow({
  notation,
  tokens,
  isValid,
  activeTokenIdx = -1
}: {
  readonly notation: string
  readonly tokens: readonly Token[]
  readonly isValid: boolean
  readonly activeTokenIdx?: number
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
  const describedWithIdx = described.map(t => ({
    token: t,
    tokenIdx: tokens.indexOf(t)
  }))

  return (
    <Box paddingX={1} flexWrap="wrap">
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
        const isActive = tokenIdx === activeTokenIdx
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
