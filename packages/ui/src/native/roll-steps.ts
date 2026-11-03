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

type DieVariant = 'kept' | 'removed' | 'added' | 'exploded'

function die(
  styles: RollerStyles,
  value: number,
  variant: DieVariant,
  key: string
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
        variant === 'exploded' ? styles.dieExploded : null
      ]
    },
    h(
      Text,
      { style: [styles.dieText, variant === 'removed' ? styles.dieTextRemoved : null] },
      value
    )
  )
}

function dice(
  styles: RollerStyles,
  values: readonly number[],
  variant: DieVariant
): React.ReactNode[] {
  return values.map((value, i) => die(styles, value, variant, `${variant}-${i}`))
}

function link(styles: RollerStyles, sign: string, key: string): React.ReactNode {
  return h(Text, { key, accessibilityElementsHidden: true, style: styles.chainLink }, sign)
}

/** The die that exploded, linked to each die its chain rolled (and what a compound became). */
function chain(
  styles: RollerStyles,
  item: DiceLayout['chains'][number],
  key: string
): React.ReactNode {
  const rolled = item.rolls.join(', ')
  const label =
    item.to === undefined
      ? `${item.from} exploded: ${rolled}`
      : `${item.from} exploded: ${rolled}, making ${item.to}`
  return h(
    View,
    { key, accessible: true, accessibilityLabel: label, style: styles.chain },
    die(styles, item.from, 'kept', 'from'),
    item.rolls.flatMap((value, i) => [
      link(styles, '→', `link-${i}`),
      die(styles, value, 'exploded', `roll-${i}`)
    ]),
    item.to === undefined
      ? null
      : [link(styles, '=', 'equals'), die(styles, item.to, 'added', 'to')]
  )
}

function step(styles: RollerStyles, item: ShownStep, key: string, label?: string): React.ReactNode {
  const heading =
    label === undefined
      ? h(Text, { style: styles.stepLabel }, item.label)
      : h(Text, { style: [styles.stepLabel, styles.stepLabelMono] }, label)
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
    { key, style: styles.step },
    heading,
    h(
      View,
      { style: styles.dice },
      layout.chains.map((c, i) => chain(styles, c, `chain-${i}`)),
      replacements.map((r, i) =>
        h(
          View,
          { key: `swap-${i}`, style: styles.swap },
          die(styles, r.from, 'removed', 'from'),
          h(Text, { accessibilityLabel: 'became', style: styles.arrow }, '→'),
          die(styles, r.to, 'added', 'to')
        )
      ),
      replacements.length === 0 ? dice(styles, layout.removed, 'removed') : null,
      replacements.length === 0 ? dice(styles, layout.added, 'added') : null,
      dice(styles, layout.unchanged, 'kept')
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
        return step(styles, only, `pool-${r}`, record.notation)
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
        steps.map((s, i) => step(styles, s, `step-${i}`))
      )
    })
  )
}
