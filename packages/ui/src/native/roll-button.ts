// <RollButton>: Roll for React Native, disabled until the notation is valid.
// Give it the state from useRoller as `roller`.
import type React from 'react'
import { createElement as h } from 'react'
import { Pressable, Text } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useStyles } from '../internal/native/styles'
import { useWatch } from '../internal/native/watch'
import type { RollerState } from '../roller-state'

export type { RollerState } from '../roller-state'

export interface RollButtonProps {
  readonly roller: RollerState
  /** What the button says. Defaults to "Roll". */
  readonly label?: string
  readonly style?: StyleProp<ViewStyle>
}

export function RollButton({ roller, label = 'Roll', style }: RollButtonProps): React.JSX.Element {
  useWatch(roller)
  const { styles } = useStyles()
  const { check } = roller
  const disabled = check.kind !== 'valid'
  return h(
    Pressable,
    {
      accessibilityRole: 'button',
      accessibilityState: { disabled },
      accessibilityHint: check.kind === 'valid' ? check.description : undefined,
      disabled,
      onPress: () => {
        roller.roll()
      },
      style: ({ pressed }: { readonly pressed: boolean }) => [
        styles.roll,
        disabled ? styles.rollDisabled : null,
        pressed ? styles.pressed : null,
        style
      ]
    },
    h(Text, { style: [styles.rollText, disabled ? styles.rollTextDisabled : null] }, label)
  )
}
