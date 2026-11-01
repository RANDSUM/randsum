// <StatusLine>: the hint, the error, or the roll in English, for React
// Native. Give it the state from useRoller as `roller`.
import type React from 'react'
import { createElement as h } from 'react'
import { Text } from 'react-native'
import type { StyleProp, TextStyle } from 'react-native'
import { DEFAULT_HINT, statusText } from '../internal/copy'
import { useStyles } from '../internal/native/styles'
import { useWatch } from '../internal/native/watch'
import type { RollerState } from '../roller-state'

export type { RollerState } from '../roller-state'

export interface StatusLineProps {
  readonly roller: RollerState
  /** Shown while the notation is empty. */
  readonly hint?: string
  /** Whether a valid roll is read back in English. Defaults to true. */
  readonly showValid?: boolean
  readonly style?: StyleProp<TextStyle>
}

export function StatusLine({
  roller,
  hint = DEFAULT_HINT,
  showValid = true,
  style
}: StatusLineProps): React.JSX.Element {
  useWatch(roller)
  const { styles } = useStyles()
  const { check } = roller
  return h(
    Text,
    {
      accessibilityLiveRegion: 'polite',
      style: [styles.status, check.kind === 'invalid' ? styles.statusInvalid : null, style]
    },
    statusText(check, hint, showValid)
  )
}
