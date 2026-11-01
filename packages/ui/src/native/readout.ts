// <Readout>: the total and its steps for React Native, or what to do before
// there is one. Give it the state from useRoller as `roller`.
import type React from 'react'
import { createElement as h } from 'react'
import { Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { EMPTY_COPY } from '../internal/copy'
import { useStyles } from '../internal/native/styles'
import { useWatch } from '../internal/native/watch'
import type { RollerState } from '../roller-state'
import { RollSteps } from './roll-steps'

export type { RollerState } from '../roller-state'

export interface ReadoutProps {
  readonly roller: RollerState
  /** Shown beside the total, such as a Roll again button. */
  readonly actions?: React.ReactNode
  /** The larger total that the max roller shows. */
  readonly large?: boolean
  readonly style?: StyleProp<ViewStyle>
}

export function Readout({
  roller,
  actions,
  large = false,
  style
}: ReadoutProps): React.JSX.Element {
  useWatch(roller)
  const { styles } = useStyles()
  const { result, check, notation } = roller
  if (result === null) {
    const [title, hint] = EMPTY_COPY[check.kind]
    return h(
      View,
      { accessibilityLabel: 'Result', style: [styles.readout, style] },
      h(Text, { style: styles.readoutTitle }, title),
      h(Text, { style: styles.readoutHint }, hint)
    )
  }
  const stale = result.notation !== notation
  return h(
    View,
    { accessibilityLabel: 'Result', style: [styles.readout, style] },
    h(
      View,
      { style: [styles.resultHead, stale ? styles.stale : null] },
      h(
        Text,
        {
          accessibilityLiveRegion: 'polite',
          accessibilityLabel: `Total ${result.total}`,
          style: [styles.total, large ? styles.totalMax : null]
        },
        result.total
      ),
      h(
        View,
        { style: styles.resultMeta },
        h(Text, { style: styles.resultNotation }, result.notation),
        h(Text, { style: styles.resultDesc }, result.description)
      ),
      actions
    ),
    h(RollSteps, { records: result.records, style: stale ? styles.stale : undefined })
  )
}
