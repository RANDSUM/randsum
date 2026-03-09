import { useCallback, useEffect, useState } from 'react'
import { useInput } from 'ink'
import type { Token } from '@randsum/notation'

/**
 * Returns the index (into `tokens`) of the token that contains `cursorPos`,
 * or -1 if the cursor is not inside any token.
 */
export function tokenCursorIndex(
  tokens: readonly Token[],
  cursorPos: number
): number {
  return tokens.findIndex((t) => cursorPos >= t.start && cursorPos < t.end)
}

/**
 * Tracks the text cursor position inside an ink text input by intercepting
 * left/right arrow keys. Returns the current cursor position and the index
 * of the token under the cursor.
 */
export function useCursorPosition(
  value: string,
  tokens: readonly Token[],
  isActive: boolean
): { readonly cursorPos: number; readonly activeTokenIdx: number } {
  const [cursorPos, setCursorPos] = useState(value.length)

  // Reset cursor to end whenever value changes (new character typed or cleared)
  useEffect(() => {
    setCursorPos(value.length)
  }, [value])

  const handleInput = useCallback(
    (
      _input: string,
      key: { readonly leftArrow?: boolean; readonly rightArrow?: boolean }
    ) => {
      if (key.leftArrow) {
        setCursorPos((prev) => Math.max(0, prev - 1))
      } else if (key.rightArrow) {
        setCursorPos((prev) => Math.min(value.length, prev + 1))
      }
    },
    [value.length]
  )

  useInput(handleInput, { isActive })

  const activeTokenIdx = tokenCursorIndex(tokens, cursorPos)

  return { cursorPos, activeTokenIdx }
}
