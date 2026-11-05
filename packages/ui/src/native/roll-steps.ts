// <RollSteps>: every step of a roll for React Native. `lanes` (the default)
// gives each die a column that runs down through the steps; `stacks` keeps one
// row of dice with each changed die's history stacked above it.
import type { RollRecord } from '@randsum/roller'
import type React from 'react'
import { createElement as h } from 'react'
import { Text, View } from 'react-native'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import type { RollerStyles } from '../internal/native/styles'
import { useStyles } from '../internal/native/styles'
import type { StepsLayout } from '../internal/parts/roll-steps'
import { poolName, timeline, visibleSteps } from '../internal/steps'
import type { Lane, LaneNode, StepInk, Timeline, TimelineRow } from '../internal/steps'
import type { RollerTheme } from './theme'

export type { StepsLayout }

export interface RollStepsProps {
  /** A roll's records: `result.records` from the roller. */
  readonly records: readonly RollRecord[]
  readonly layout?: StepsLayout
  readonly style?: StyleProp<ViewStyle>
}

interface Draw {
  readonly styles: RollerStyles
  readonly theme: RollerTheme
}

function inkColour(theme: RollerTheme, ink: StepInk | 'removed'): string {
  switch (ink) {
    case 'clamp':
      return theme.inkClamp
    case 'substitute':
      return theme.inkSubstitute
    case 'generate':
      return theme.inkGenerate
    case 'filter':
    case 'removed':
      return theme.inkFilter
    case 'add':
      return theme.inkAdd
    case 'subtract':
      return theme.inkSubtract
    default:
      return theme.ink
  }
}

type DieVariant = 'kept' | 'removed' | 'was'

function die(
  { styles }: Draw,
  value: number,
  variant: DieVariant,
  key: string,
  options: { readonly large?: boolean; readonly label?: string; readonly style?: TextStyle } = {}
): React.ReactNode {
  return h(
    View,
    {
      key,
      accessibilityLabel: options.label ?? String(value),
      accessibilityElementsHidden: variant === 'was',
      style: [
        styles.die,
        options.large === true ? styles.dieInitial : null,
        variant === 'removed' ? styles.dieRemoved : null,
        variant === 'was' ? styles.dieWas : null,
        options.style ?? null
      ]
    },
    h(
      Text,
      {
        style: [
          styles.dieText,
          options.large === true ? styles.dieTextInitial : null,
          variant === 'removed' ? styles.dieTextRemoved : null,
          variant === 'was' ? styles.dieTextWas : null
        ]
      },
      value
    )
  )
}

/** An arithmetic step as a cell: green when it adds, red when it subtracts. */
function mathCell(draw: Draw, row: TimelineRow, key: string): React.ReactNode {
  const colour = row.ink === 'plain' ? draw.theme.borderStrong : inkColour(draw.theme, row.ink)
  return h(
    View,
    {
      key,
      accessibilityLabel: `${row.label} ${row.math}`,
      style: [draw.styles.die, draw.styles.math, { borderColor: colour }]
    },
    h(
      Text,
      {
        style: [
          draw.styles.dieText,
          draw.styles.mathText,
          { color: row.ink === 'plain' ? draw.theme.ink : colour }
        ]
      },
      (row.math ?? '').replace(/^-/, '−')
    )
  )
}

function stepLabel(draw: Draw, text: string, ink: StepInk, strong: boolean): React.ReactNode {
  const colour = inkColour(draw.theme, ink)
  return h(
    View,
    { style: draw.styles.labelRow },
    h(View, { style: [draw.styles.pip, { backgroundColor: colour }] }),
    h(
      Text,
      {
        style: [
          draw.styles.stepLabel,
          draw.styles.stepLabelInk,
          { color: colour },
          strong ? draw.styles.stepLabelInitial : null
        ]
      },
      text
    )
  )
}

function link(styles: RollerStyles, key: string): React.ReactNode {
  return h(Text, { key, accessibilityElementsHidden: true, style: styles.chainLink }, '→')
}

/** A die where a step touched it. */
function node(draw: Draw, n: LaneNode, large: boolean): React.ReactNode {
  const style = draw.styles.laneDie
  switch (n.kind) {
    case 'removed':
      return die(draw, n.value, 'removed', 'die', { label: `${n.value}, removed`, style })
    case 'trigger':
      return die(draw, n.value, 'kept', 'die', {
        label: `${n.value} exploded: ${(n.exploded ?? []).join(', ')}`,
        style
      })
    case 'changed':
      if (n.chain !== undefined) {
        const [from, ...rolls] = n.chain
        return h(
          View,
          {
            key: 'die',
            accessible: true,
            accessibilityLabel: `${from} exploded: ${rolls.join(', ')}`,
            style: [draw.styles.chain, style]
          },
          n.chain.flatMap((value, i) => [
            i > 0 ? link(draw.styles, `link-${i}`) : null,
            die(draw, value, 'kept', `roll-${i}`)
          ])
        )
      }
      return die(draw, n.value, 'kept', 'die', { label: `${n.value}, was ${n.was}`, style })
    default:
      return die(draw, n.value, 'kept', 'die', large ? { large } : { style })
  }
}

/** The ink of the line that runs into the next node after `row` (or at it, with `at`). */
function lineInk(
  rows: readonly TimelineRow[],
  lane: Lane,
  row: number,
  at: boolean
): StepInk | 'removed' {
  const next = lane.nodes.find(n => (at ? n.row >= row : n.row > row))
  if (next === undefined) return 'plain'
  if (next.kind === 'removed') return 'removed'
  if (next.kind === 'changed') return rows[next.row]?.ink ?? 'plain'
  return 'plain'
}

/** How wide a lane is: one die, or the widest compounding chain in it. */
function laneWidth(lane: Lane): number {
  const longest = Math.max(1, ...lane.nodes.map(n => n.chain?.length ?? 1))
  return longest === 1 ? 52 : longest * 36 + (longest - 1) * 16 + 12
}

/** A term's lane, such as `+5`: wide enough for its cell, its line down the middle. */
const TERM_WIDTH = 56

/** Each die in its own lane, carried down until a step touches it. */
function lanes(draw: Draw, t: Timeline): React.ReactNode {
  const { styles, theme } = draw
  const result = t.rows.length
  const shown = t.changed ? [...t.rows, null] : t.rows
  const terms = t.rows.flatMap((row, at) => (row.math === undefined ? [] : [{ row, at }]))
  return h(
    View,
    { key: 'lanes' },
    shown.map((row, r) => {
      const isResult = row === null
      return h(
        View,
        {
          key: `row-${r}`,
          style: [
            styles.laneRow,
            r === 0 ? styles.laneRowInitial : null,
            isResult ? styles.laneRowResult : null
          ]
        },
        h(
          View,
          { style: styles.laneLabel },
          isResult
            ? stepLabel(draw, `= ${t.total}`, 'plain', true)
            : stepLabel(draw, row.label, row.ink, r === 0)
        ),
        t.lanes.map((lane, i) => {
          const first = lane.nodes[0]?.row ?? 0
          const last = lane.nodes[lane.nodes.length - 1]
          const end =
            last === undefined || last.kind === 'removed' || !t.changed ? (last?.row ?? 0) : result
          const width = laneWidth(lane)
          if (r < first || r > end) return h(View, { key: `lane-${i}`, style: { width } })
          const n = lane.nodes.find(x => x.row === r)
          const large = r === 0 || isResult
          const line = (ink: StepInk | 'removed', style: ViewStyle): React.ReactNode =>
            h(View, {
              style: [
                style,
                {
                  borderLeftColor: ink === 'plain' ? theme.line : inkColour(theme, ink),
                  borderStyle: ink === 'removed' ? 'dashed' : 'solid'
                }
              ]
            })
          return h(
            View,
            {
              key: `lane-${i}`,
              style: [
                styles.lane,
                { width },
                r === 0 ? styles.laneInitial : null,
                isResult ? styles.laneResult : null
              ]
            },
            r > first ? line(lineInk(t.rows, lane, r, true), styles.laneLineIn) : null,
            r < end ? line(lineInk(t.rows, lane, r, false), styles.laneLineOut) : null,
            n?.kind === 'born' && lane.chained
              ? h(
                  Text,
                  {
                    accessibilityElementsHidden: true,
                    style: [styles.chainLink, styles.laneArrow]
                  },
                  '→'
                )
              : null,
            n !== undefined
              ? node(draw, n, large)
              : isResult && lane.final !== undefined
                ? die(draw, lane.final, 'kept', 'die', { large: true })
                : null
          )
        }),
        terms.map(({ row: term, at }, k) => {
          if (r < at) return h(View, { key: `term-${k}`, style: { width: TERM_WIDTH } })
          const line = (style: ViewStyle): React.ReactNode =>
            h(View, { style: [style, styles.laneTermLine, { borderLeftColor: theme.line }] })
          return h(
            View,
            {
              key: `term-${k}`,
              style: [
                styles.lane,
                styles.laneTerm,
                { width: TERM_WIDTH },
                isResult ? styles.laneResult : null
              ]
            },
            r > at ? line(styles.laneLineIn) : null,
            r < result ? line(styles.laneLineOut) : null,
            r === at || isResult ? mathCell(draw, term, 'math') : null
          )
        })
      )
    })
  )
}

/** One row of dice as they ended up, each changed die's history stacked above it. */
function stacks(draw: Draw, t: Timeline): React.ReactNode {
  const { styles, theme } = draw
  const legend = t.rows.slice(1)
  return h(
    View,
    { key: 'stacks', style: styles.stacks },
    h(
      View,
      { style: styles.stackRow },
      t.lanes.flatMap((lane, i) => {
        const last = lane.nodes[lane.nodes.length - 1]
        const history = lane.nodes.filter(n => n.kind === 'changed')
        return [
          lane.chained
            ? h(View, { key: `arrow-${i}`, style: styles.stackArrow }, link(styles, 'link'))
            : null,
          h(
            View,
            { key: `stack-${i}`, style: styles.stack },
            history.flatMap((n, k) => [
              die(draw, n.was ?? 0, 'was', `was-${k}`),
              h(View, {
                key: `link-${k}`,
                style: [
                  styles.stackLink,
                  { borderLeftColor: inkColour(theme, t.rows[n.row]?.ink ?? 'plain') }
                ]
              })
            ]),
            lane.final === undefined
              ? die(draw, last?.value ?? 0, 'removed', 'final', {
                  label: `${last?.value}, removed`
                })
              : die(draw, lane.final, 'kept', 'final')
          )
        ]
      }),
      t.rows.map((row, r) => (row.math === undefined ? null : mathCell(draw, row, `math-${r}`)))
    ),
    legend.length > 0
      ? h(
          View,
          { style: styles.legend },
          legend.map((row, r) =>
            h(View, { key: `legend-${r}` }, stepLabel(draw, row.label, row.ink, false))
          )
        )
      : null
  )
}

/** A plain pool in a multi-pool roll: its name and its dice on one row. */
function plainPool(draw: Draw, record: RollRecord, key: string): React.ReactNode {
  const { styles } = draw
  const pool = poolName(record)
  return h(
    View,
    { key, style: [styles.step, styles.stepInitial] },
    h(
      Text,
      {
        style: [
          styles.stepLabel,
          styles.stepLabelInitial,
          pool.notation ? styles.stepLabelMono : null
        ]
      },
      pool.text
    ),
    h(
      View,
      { style: styles.dice },
      record.initialRolls.map((value, i) => die(draw, value, 'kept', `die-${i}`, { large: true }))
    )
  )
}

export function RollSteps({ records, layout = 'lanes', style }: RollStepsProps): React.JSX.Element {
  const { styles, theme } = useStyles()
  const draw: Draw = { styles, theme }
  const multiPool = records.length > 1
  return h(
    View,
    { style: [styles.steps, style] },
    records.map((record, r) => {
      if (multiPool && visibleSteps(record).length === 1)
        return plainPool(draw, record, `pool-${r}`)
      const pool = poolName(record)
      const t = timeline(record)
      return h(
        View,
        { key: `pool-${r}`, accessibilityLabel: pool.text, style: styles.poolGroup },
        multiPool
          ? h(
              View,
              { style: styles.poolHeading },
              h(
                Text,
                { style: [styles.poolHeadingText, pool.notation ? null : styles.poolHeadingLabel] },
                pool.text
              ),
              h(Text, { style: styles.poolHeadingText }, record.total)
            )
          : null,
        layout === 'stacks' ? stacks(draw, t) : lanes(draw, t)
      )
    })
  )
}
