import { Box, Text } from 'ink'
import { useEffect, useState } from 'react'
import type { Token } from '@randsum/roller/tokenize'
import { getTokenColor } from '../helpers/tokenColors'

function useCursorBlink(active: boolean): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!active) {
      setVisible(true)
      return
    }
    const id = setInterval(() => {
      setVisible(v => !v)
    }, 530)
    return () => {
      clearInterval(id)
    }
  }, [active])
  return visible
}

interface Part {
  text: string
  tokenType?: Token['category']
  isActive: boolean
  startPos: number
}

function renderPart(
  part: Part,
  key: string,
  dimAll: boolean,
  highlightColor?: string
): React.JSX.Element {
  if (dimAll && !part.isActive) {
    return (
      <Text key={key} dimColor>
        {part.text}
      </Text>
    )
  }
  if (part.isActive && highlightColor !== undefined) {
    return (
      <Text key={key} color={highlightColor} bold inverse>
        {part.text}
      </Text>
    )
  }
  const color = part.tokenType !== undefined ? getTokenColor(part.tokenType) : undefined
  if (color !== undefined) {
    return (
      <Text key={key} color={color} bold={part.isActive} inverse={part.isActive}>
        {part.text}
      </Text>
    )
  }
  if (part.isActive) {
    return (
      <Text key={key} inverse>
        {part.text}
      </Text>
    )
  }
  return (
    <Text key={key} dimColor>
      {part.text}
    </Text>
  )
}

export function NotationHighlight({
  input,
  tokens,
  activeTokenIdx,
  dimAll = false,
  highlightColor,
  cursorPos,
  showCursor = false
}: {
  readonly input: string
  readonly tokens: readonly Token[]
  readonly activeTokenIdx?: number // undefined = color only; -1 = highlight all; >= 0 = highlight one
  readonly dimAll?: boolean
  readonly highlightColor?: string // overrides token colors when highlighting (used with activeTokenIdx === -1)
  readonly cursorPos?: number
  readonly showCursor?: boolean
}): React.JSX.Element {
  const activeToken =
    activeTokenIdx !== undefined && activeTokenIdx >= 0 ? tokens[activeTokenIdx] : undefined
  const highlightAll = activeTokenIdx === -1

  // For invalid input with no tokens, treat the whole string as one part
  const sorted = [...tokens].sort((a, b) => a.start - b.start)
  const { parts, lastPos } = sorted.reduce<{ parts: Part[]; lastPos: number }>(
    (acc, token) => {
      if (token.start > acc.lastPos) {
        acc.parts.push({
          text: input.slice(acc.lastPos, token.start),
          isActive: highlightAll,
          startPos: acc.lastPos
        })
      }
      acc.parts.push({
        text: token.text,
        tokenType: token.category,
        isActive: highlightAll || token === activeToken,
        startPos: token.start
      })
      return { parts: acc.parts, lastPos: token.end }
    },
    { parts: [], lastPos: 0 }
  )
  if (lastPos < input.length) {
    parts.push({ text: input.slice(lastPos), isActive: highlightAll, startPos: lastPos })
  }

  const cursorVisible = useCursorBlink(showCursor)

  // Build render elements, injecting cursor at cursorPos
  const elements: React.JSX.Element[] = []

  if (!showCursor || cursorPos === undefined) {
    parts.forEach((part, i) => {
      if (part.text.length > 0) elements.push(renderPart(part, String(i), dimAll, highlightColor))
    })
  } else {
    const cursorPartIdx = parts.findIndex(
      part => cursorPos >= part.startPos && cursorPos < part.startPos + part.text.length
    )
    parts.forEach((part, i) => {
      if (i === cursorPartIdx) {
        const localOffset = cursorPos - part.startPos
        const before = { ...part, text: part.text.slice(0, localOffset) }
        const after = { ...part, text: part.text.slice(localOffset) }
        if (before.text.length > 0)
          elements.push(renderPart(before, `${i}a`, dimAll, highlightColor))
        elements.push(
          <Text key={`${i}cur`} dimColor>
            {cursorVisible ? '|' : ' '}
          </Text>
        )
        if (after.text.length > 0) elements.push(renderPart(after, `${i}b`, dimAll, highlightColor))
      } else if (part.text.length > 0) {
        elements.push(renderPart(part, String(i), dimAll, highlightColor))
      }
    })
    if (cursorPartIdx === -1) {
      elements.push(
        <Text key="cur" dimColor>
          {cursorVisible ? '|' : ' '}
        </Text>
      )
    }
  }

  return <Box>{elements}</Box>
}
