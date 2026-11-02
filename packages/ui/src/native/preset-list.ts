// <PresetList>: named rolls for React Native, as chips or as a list that
// shows each description. Give it the state from useRoller as `roller`.
import type React from 'react'
import { createElement as h } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useStyles } from '../internal/native/styles'
import type { PresetsLayout } from '../internal/parts/preset-list'
import { useWatch } from '../internal/native/watch'
import type { Preset } from '../presets'
import type { RollerState } from '../roller-state'

export type { PresetsLayout } from '../internal/parts/preset-list'
export type { Preset } from '../presets'
export type { RollerState } from '../roller-state'

export interface PresetListProps {
  readonly roller: RollerState
  readonly presets: readonly Preset[]
  /** The group's accessible name. Defaults to "Presets". */
  readonly label?: string
  /** 'chips' (the default) or 'list', which shows each description. */
  readonly layout?: PresetsLayout
  readonly style?: StyleProp<ViewStyle>
}

export function PresetList({
  roller,
  presets,
  label = 'Presets',
  layout = 'chips',
  style
}: PresetListProps): React.JSX.Element {
  useWatch(roller)
  const { styles } = useStyles()
  const list = layout === 'list'
  return h(
    View,
    {
      accessibilityLabel: label,
      style: [styles.presets, list ? styles.presetsList : null, style]
    },
    presets.map(preset => {
      const on = roller.notation === preset.notation
      return h(
        Pressable,
        {
          key: `${preset.label}-${preset.notation}`,
          accessibilityRole: 'button',
          accessibilityLabel: list ? undefined : `${preset.label}, ${preset.notation}`,
          accessibilityHint: preset.description,
          accessibilityState: { selected: on },
          onPress: () => {
            roller.choose(preset)
          },
          style: ({ pressed }: { readonly pressed: boolean }) => [
            styles.preset,
            list ? styles.presetRow : null,
            on ? styles.keyOn : null,
            pressed ? styles.pressed : null
          ]
        },
        list
          ? [
              h(Text, { key: 'n', style: styles.presetNotation }, preset.notation),
              preset.description === undefined
                ? null
                : h(Text, { key: 'd', style: styles.presetDesc }, preset.description)
            ]
          : h(Text, { style: styles.presetText }, preset.label)
      )
    })
  )
}
