// <RollSteps>: every step of a roll for React Native: what was rolled, what
// changed, what was added.
import type { RollRecord } from '@randsum/roller'
import type React from 'react'
import { createElement as h } from 'react'
import { Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type { RollerStyles } from '../internal/native/styles'
import { useStyles } from '../internal/native/styles'
import { diceLayout, visibleSteps } from '../internal/steps'
import type { DiceLayout, ShownStep } from '../internal/steps'

export interface RollStepsProps {
  /** A roll's records: `result.records` from the roller. */
  readonly records: readonly RollRecord[]
  readonly style?: StyleProp<ViewStyle>
}

type DieVariant = 'kept' | 'removed' | 'added'

function die(
  styles: RollerStyles,
  value: number,
  variant: DieVariant,
  key: string,
  initial = false
): React.ReactNode {
  return h(
    View,
    {
      key,
      accessibilityLabel: variant === 'kept' ? String(value) : `${value}, ${variant}`,
      style: [
        styles.die,
        variant === 'removed' ? styles.dieRemoved : null,
        variant === 'added' ? styles.dieAdded : null,
        initial ? styles.dieInitial : null
      ]
    },
    h(
      Text,
      {
        style: [
          styles.dieText,
          initial ? styles.dieTextInitial : null,
          variant === 'removed' ? styles.dieTextRemoved : null
        ]
      },
      value
    )
  )
}

function dice(
  styles: RollerStyles,
  values: readonly number[],
  variant: DieVariant,
  initial = false
): React.ReactNode[] {
  return values.map((value, i) => die(styles, value, variant, `${variant}-${i}`, initial))
}

function link(styles: RollerStyles, key: string): React.ReactNode {
  return h(Text, { key, accessibilityElementsHidden: true, style: styles.chainLink }, '→')
}

/** The die that exploded, linked to each die its chain rolled. */
function chain(
  styles: RollerStyles,
  item: DiceLayout['chains'][number],
  key: string,
  initial: boolean
): React.ReactNode {
  return h(
    View,
    {
      key,
      accessible: true,
      accessibilityLabel: `${item.from} exploded: ${item.rolls.join(', ')}`,
      style: styles.chain
    },
    die(styles, item.from, 'kept', 'from', initial),
    item.rolls.flatMap((value, i) => [
      link(styles, `link-${i}`),
      die(styles, value, 'kept', `roll-${i}`, initial)
    ])
  )
}

/** One step; the initial roll (`initial`) stands out above the modifier steps. */
function step(
  styles: RollerStyles,
  item: ShownStep,
  key: string,
  initial: boolean,
  label?: string,
  divided = false
): React.ReactNode {
  const labelStyle = [styles.stepLabel, initial ? styles.stepLabelInitial : null]
  const heading =
    label === undefined
      ? h(Text, { style: labelStyle }, item.label)
      : h(Text, { style: [...labelStyle, styles.stepLabelMono] }, label)
  if (item.kind === 'arithmetic') {
    return h(
      View,
      { key, style: styles.step },
      heading,
      h(Text, { style: styles.stepMath }, item.display)
    )
  }
  const replacements = item.replacements ?? []
  const layout = diceLayout(item)
  return h(
    View,
    { key, style: [styles.step, divided ? styles.stepDivided : null] },
    heading,
    h(
      View,
      { style: styles.dice },
      layout.chains.map((c, i) => chain(styles, c, `chain-${i}`, initial)),
      replacements.map((r, i) =>
        h(
          View,
          { key: `swap-${i}`, style: styles.swap },
          die(styles, r.from, 'removed', 'from', initial),
          h(Text, { accessibilityLabel: 'became', style: styles.arrow }, '→'),
          die(styles, r.to, 'added', 'to', initial)
        )
      ),
      replacements.length === 0 ? dice(styles, layout.removed, 'removed', initial) : null,
      replacements.length === 0 ? dice(styles, layout.added, 'added', initial) : null,
      dice(styles, layout.unchanged, 'kept', initial)
    )
  )
}

export function RollSteps({ records, style }: RollStepsProps): React.JSX.Element {
  const { styles } = useStyles()
  const multiPool = records.length > 1
  return h(
    View,
    { style: [styles.steps, style] },
    records.map((record, r) => {
      const steps = visibleSteps(record)
      const [only] = steps
      // A plain pool in a multi-pool roll is one row: its notation and its dice
      if (multiPool && steps.length === 1 && only !== undefined) {
        return step(styles, only, `pool-${r}`, true, record.notation)
      }
      return h(
        View,
        { key: `pool-${r}`, accessibilityLabel: record.notation, style: styles.poolGroup },
        multiPool
          ? h(
              View,
              { style: styles.poolHeading },
              h(Text, { style: styles.poolHeadingText }, record.notation),
              h(Text, { style: styles.poolHeadingText }, record.total)
            )
          : null,
        steps.map((s, i) =>
          step(styles, s, `step-${i}`, i === 0, undefined, i === 0 && steps.length > 1)
        )
      )
    })
  )
}
