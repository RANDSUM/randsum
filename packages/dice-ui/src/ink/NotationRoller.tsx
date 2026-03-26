import React, { useEffect, useRef, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import type { RollResult } from '../types'

export interface InkNotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
  readonly onRoll?: (result: RollResult) => void
}

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  onChange,
  resetToken,
  onRoll
}: InkNotationRollerProps = {}): React.JSX.Element {
  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const rollingRef = useRef(false)

  useEffect(() => {
    setNotation(defaultNotation)
  }, [resetToken])

  const isValid = notation.length > 0 && isDiceNotation(notation)

  useInput((input, key) => {
    if (key.return) {
      if (!isValid || rollingRef.current) return
      rollingRef.current = true
      try {
        const result = roll(notation)
        onRoll?.({ total: result.total, records: result.rolls, notation })
      } catch {
        // validation guard above should prevent this
      }
      rollingRef.current = false
      return
    }

    if (key.backspace || key.delete) {
      const next = notation.slice(0, -1)
      setNotation(next)
      onChange?.(next)
      return
    }

    if (input && !key.ctrl && !key.meta) {
      const next = notation + input
      setNotation(next)
      onChange?.(next)
    }
  })

  const statusColor = notation.length === 0 ? 'gray' : isValid ? 'green' : 'red'
  const statusText =
    notation.length === 0
      ? 'Try: 4d6L, 1d20+5, 2d8!'
      : isValid
        ? 'Valid — press Enter to roll'
        : 'Invalid notation'

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Text dimColor>{'>'}</Text>
        <Text>{notation}</Text>
      </Box>
      <Text color={statusColor}>{statusText}</Text>
    </Box>
  )
}
