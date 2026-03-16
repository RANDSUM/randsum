import { useCallback } from 'react'
import { useInput } from 'ink'
import type { Token } from '@randsum/roller/tokenize'

/**
 * Returns the index (into `tokens`) of the token that contains `cursorPos`,
 * or -1 if the cursor is not inside any token.
 */
export function tokenCursorIndex(tokens: readonly Token[], cursorPos: number): number {
  return tokens.findIndex(t => cursorPos >= t.start && cursorPos < t.end)
}

/**
 * Handles left/right arrow navigation for a cursor managed externally.
 * Returns the index of the token under the cursor.
 */
export function useCursorPosition(
  value: string,
  tokens: readonly Token[],
  isActive: boolean,
  cursorPos: number,
  onCursorMove: (pos: number) => void,
  onLeftBoundary?: () => void
): { readonly activeTokenIdx: number } {
  const handleInput = useCallback(
    (_input: string, key: { readonly leftArrow?: boolean; readonly rightArrow?: boolean }) => {
      if (key.leftArrow) {
        if (cursorPos === 0) {
          onLeftBoundary?.()
        } else {
          onCursorMove(Math.max(0, cursorPos - 1))
        }
      } else if (key.rightArrow) {
        onCursorMove(Math.min(value.length, cursorPos + 1))
      }
    },
    [value.length, cursorPos, onLeftBoundary, onCursorMove]
  )

  useInput(handleInput, { isActive })

  const activeTokenIdx = tokenCursorIndex(tokens, cursorPos)
  return { activeTokenIdx }
}
