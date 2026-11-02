// <KeyPad>: dice and modifier keys for React Native, each filling its share
// of the row. Give it the state from useRoller as `roller`.
import type React from 'react'
import { createElement as h } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useStyles } from '../internal/native/styles'
import { useWatch } from '../internal/native/watch'
import { DEFAULT_KEYS } from '../keys'
import type { Key } from '../keys'
import type { RollerState } from '../roller-state'

export type { Key } from '../keys'
export type { RollerState } from '../roller-state'

export interface KeyPadProps {
  readonly roller: RollerState
  /** The keys to show. Defaults to DEFAULT_KEYS from `@randsum/ui/keys`. */
  readonly keys?: readonly Key[]
  /** The group's accessible name. Defaults to "Dice keys". */
  readonly label?: string
  readonly style?: StyleProp<ViewStyle>
}

export function KeyPad({
  roller,
  keys = DEFAULT_KEYS,
  label = 'Dice keys',
  style
}: KeyPadProps): React.JSX.Element {
  useWatch(roller)
  const { styles } = useStyles()
  return h(
    View,
    { accessibilityRole: 'toolbar', accessibilityLabel: label, style: [styles.keys, style] },
    keys.map(key => {
      const { action } = key
      const on = action.kind === 'modifier' && roller.notation.includes(action.text)
      return h(
        Pressable,
        {
          key: `${action.kind}-${key.label}`,
          accessibilityRole: 'button',
          accessibilityLabel: key.title ?? key.label,
          accessibilityState: action.kind === 'modifier' ? { selected: on } : undefined,
          onPress: () => {
            roller.press(key)
          },
          style: ({ pressed }: { readonly pressed: boolean }) => [
            styles.key,
            on ? styles.keyOn : null,
            pressed ? styles.pressed : null
          ]
        },
        h(
          Text,
          { style: [styles.keyText, action.kind === 'die' ? styles.keyDieText : null] },
          key.label
        )
      )
    })
  )
}
