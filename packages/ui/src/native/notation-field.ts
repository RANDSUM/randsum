// <NotationField>: the notation input for React Native, each token in its
// modifier's colour as you type. Give it the state from useRoller as `roller`.
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type React from 'react'
import { createElement as h } from 'react'
import { Platform, Text, TextInput, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useStyles } from '../internal/native/styles'
import { useWatch } from '../internal/native/watch'
import type { RollerState } from '../roller-state'

export type { RollerState } from '../roller-state'

export interface NotationFieldProps {
  readonly roller: RollerState
  /** Shown while the field is empty. Defaults to 4d6L. */
  readonly placeholder?: string
  readonly style?: StyleProp<ViewStyle>
}

const MARKS = { valid: '✓', invalid: '✕' } as const
const MARK_LABELS = { valid: 'Valid', invalid: 'Invalid' } as const
const RICH = Platform.OS !== 'web'

export function NotationField({
  roller,
  placeholder = '4d6L',
  style
}: NotationFieldProps): React.JSX.Element {
  useWatch(roller)
  const { theme, styles } = useStyles()
  const { tokens, check } = roller
  // On iOS and Android the text is the input's children, so each token keeps
  // its own colour while it stays one editable value. React Native Web's
  // input cannot hold children, so on the web it is a plain value.
  const spans = tokens.map(token => {
    const doc = NOTATION_DOCS[token.key]
    const color =
      doc === undefined ? undefined : theme.scheme === 'dark' ? doc.color : doc.colorLight
    return h(
      Text,
      {
        key: token.start,
        style: [
          color === undefined ? null : { color },
          token.category === 'unknown' ? styles.tokenBad : null
        ]
      },
      token.text
    )
  })
  return h(
    View,
    {
      style: [
        styles.field,
        check.kind === 'valid' ? styles.fieldValid : null,
        check.kind === 'invalid' ? styles.fieldInvalid : null,
        style
      ]
    },
    h(
      TextInput,
      {
        style: styles.input,
        placeholder,
        placeholderTextColor: theme.faint,
        autoCapitalize: 'none',
        autoCorrect: false,
        spellCheck: false,
        autoComplete: 'off',
        returnKeyType: 'go',
        submitBehavior: 'submit',
        accessibilityLabel: 'Dice notation',
        accessibilityHint: check.kind === 'invalid' ? check.message : undefined,
        onChangeText: (next: string) => {
          roller.edit(next)
        },
        onSubmitEditing: () => {
          roller.roll()
        },
        ...(RICH ? {} : { value: roller.notation })
      },
      RICH ? spans : undefined
    ),
    check.kind === 'empty'
      ? null
      : h(
          Text,
          {
            accessibilityRole: 'image',
            accessibilityLabel: MARK_LABELS[check.kind],
            style: [styles.mark, check.kind === 'valid' ? styles.markValid : styles.markInvalid]
          },
          MARKS[check.kind]
        )
  )
}
