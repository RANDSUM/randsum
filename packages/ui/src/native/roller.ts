// <Roller size="mini" | "compact" | "max">: the whole roller for React Native
// and Expo, built from native views on the same RollerState as the elements.
//
//   <Roller size="compact" defaultNotation="4d6L" onRoll={r => …} />
//
// "mini" is the field and Roll, with the keys and the total a row below;
// "compact" (the default) is a panel with the readout beside or above the
// builder; "max" adds recent rolls and a History sheet.
import type React from 'react'
import { createElement as h, useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import type { RollResult } from '../check'
import { EMPTY_HISTORY } from '../internal/copy'
import { useStyles } from '../internal/native/styles'
import type { RollerStyles } from '../internal/native/styles'
import type { PresetsLayout } from '../internal/parts/preset-list'
import { DEFAULT_KEYS } from '../keys'
import type { Key } from '../keys'
import type { Preset } from '../presets'
import type { RollerState } from '../roller-state'
import { useRoller } from '../react/use-roller'
import { KeyPad } from './key-pad'
import { NotationField } from './notation-field'
import { PresetList } from './preset-list'
import { Readout } from './readout'
import { RollButton } from './roll-button'
import { RollSteps } from './roll-steps'
import { StatusLine } from './status-line'

export type { RollResult } from '../check'
export type { PresetsLayout } from '../internal/parts/preset-list'
export type { Key } from '../keys'
export type { Preset } from '../presets'

export type RollerSize = 'max' | 'compact' | 'mini'
export type RollerOrientation = 'auto' | 'landscape' | 'portrait'

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly description: string
}

export interface RollerProps {
  /** 'mini', 'compact' (the default) or 'max'. */
  readonly size?: RollerSize
  /** Starting notation when the roller manages its own value. */
  readonly defaultNotation?: string
  /** The notation, kept in step with the host; pair it with onChange. */
  readonly notation?: string
  /** Fires on every edit: typing, a key, or a preset. */
  readonly onChange?: (notation: string) => void
  /** Fires after each roll with the full result. */
  readonly onRoll?: (result: RollResult) => void
  /** Each new value rolls the current notation, so a host can roll on demand. */
  readonly rollSignal?: number
  /** The keys to show. Defaults to DEFAULT_KEYS from `@randsum/ui/keys`. */
  readonly keys?: readonly Key[]
  /** Optional named rolls. The keys stay first; presets sit behind a switch. */
  readonly presets?: readonly Preset[]
  /** What the presets are called on screen. Defaults to "Presets". */
  readonly presetsLabel?: string
  /** Compact: 'chips' (the default) or 'list', which shows each description. */
  readonly presetsLayout?: PresetsLayout
  readonly placeholder?: string
  /** Compact: the readout beside the builder, above it, or by width ('auto'). */
  readonly orientation?: RollerOrientation
  /** Mini and Compact: a link to the full roller, opened with Linking. */
  readonly appLink?: string
  /** Compact: extra footer content, after the app link. */
  readonly footer?: React.ReactNode
  /** Max: recent rolls and a History sheet. Defaults to true. */
  readonly history?: boolean
  /** Max: how many rolls history keeps. Defaults to 50. */
  readonly historyLimit?: number
  /** Max: history to start from, such as what onHistoryChange last saved. */
  readonly initialHistory?: readonly HistoryEntry[]
  /** Max: fires with the whole history after each change, to persist it (AsyncStorage, say). */
  readonly onHistoryChange?: (history: readonly HistoryEntry[]) => void
  readonly style?: StyleProp<ViewStyle>
}

const RECENT = 3
// Compact puts the readout beside the builder from this width up
const LANDSCAPE_WIDTH = 640

interface Shared {
  readonly roller: RollerState
  readonly styles: RollerStyles
  readonly props: RollerProps
}

function QuietButton({
  styles,
  label,
  onPress,
  accessibilityLabel
}: {
  readonly styles: RollerStyles
  readonly label: string
  readonly onPress: () => void
  readonly accessibilityLabel?: string
}): React.JSX.Element {
  return h(
    Pressable,
    {
      accessibilityRole: 'button',
      accessibilityLabel,
      onPress,
      style: ({ pressed }: { readonly pressed: boolean }) => [
        styles.quiet,
        pressed ? styles.pressed : null
      ]
    },
    h(Text, { style: styles.quietText }, label)
  )
}

function AppLink({
  styles,
  href,
  label
}: {
  readonly styles: RollerStyles
  readonly href: string
  readonly label: string
}): React.JSX.Element {
  return h(
    Pressable,
    {
      accessibilityRole: 'link',
      onPress: () => {
        Linking.openURL(href).catch(() => undefined)
      }
    },
    h(Text, { style: styles.link }, label)
  )
}

function Mini({ roller, styles, props }: Shared): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(false)
  const { result } = roller
  const fresh = result !== null && result.notation === roller.notation
  const presets = props.presets ?? []
  return h(
    View,
    { style: [styles.panel, props.style] },
    h(
      View,
      { style: styles.row },
      h(NotationField, {
        roller,
        ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })
      }),
      h(RollButton, { roller })
    ),
    h(
      View,
      { style: styles.footer },
      h(
        Pressable,
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Dice keys',
          accessibilityState: { expanded: open },
          onPress: () => {
            setOpen(o => !o)
          },
          style: ({ pressed }: { readonly pressed: boolean }) => [
            styles.miniTotal,
            open ? styles.keyOn : null,
            pressed ? styles.pressed : null
          ]
        },
        h(Text, { style: styles.quietText }, 'Dice')
      ),
      result === null
        ? null
        : h(
            Pressable,
            {
              accessibilityRole: 'button',
              accessibilityLabel: `Total ${result.total}`,
              accessibilityHint: 'Shows how the roll was made',
              accessibilityState: { expanded: detail },
              onPress: () => {
                setDetail(d => !d)
              },
              style: [styles.miniTotal, fresh ? null : styles.stale]
            },
            h(Text, { style: styles.miniTotalText }, result.total)
          ),
      h(StatusLine, {
        roller,
        hint: 'Type notation, or open the dice keys.',
        style: styles.grow
      })
    ),
    open
      ? h(
          View,
          { style: styles.steps },
          h(KeyPad, { roller, keys: props.keys ?? DEFAULT_KEYS }),
          presets.length > 0
            ? h(
                View,
                { style: styles.step },
                h(Text, { style: styles.stepLabel }, props.presetsLabel ?? 'Presets'),
                h(PresetList, { roller, presets, label: props.presetsLabel ?? 'Presets' })
              )
            : null
        )
      : null,
    detail && result !== null
      ? h(RollSteps, { records: result.records, style: fresh ? undefined : styles.stale })
      : null,
    props.appLink === undefined
      ? null
      : h(AppLink, { styles, href: props.appLink, label: 'Open in the Roller' })
  )
}

function Compact({ roller, styles, props }: Shared): React.JSX.Element {
  const [tab, setTab] = useState<'keys' | 'presets'>('keys')
  const [wide, setWide] = useState(false)
  const presets = props.presets ?? []
  const label = props.presetsLabel ?? 'Presets'
  const hasPresets = presets.length > 0
  const showPresets = hasPresets && tab === 'presets'
  const orientation = props.orientation ?? 'auto'
  const landscape = orientation === 'landscape' || (orientation === 'auto' && wide)
  const onLayout = (event: LayoutChangeEvent): void => {
    setWide(event.nativeEvent.layout.width >= LANDSCAPE_WIDTH)
  }
  const tabButton = (id: 'keys' | 'presets', text: string): React.ReactNode => {
    const on = (id === 'presets') === showPresets
    return h(
      Pressable,
      {
        key: id,
        accessibilityRole: 'tab',
        accessibilityState: { selected: on },
        onPress: () => {
          setTab(id)
        },
        style: [styles.tab, on ? styles.tabOn : null]
      },
      h(Text, { style: [styles.tabText, on ? styles.tabTextOn : null] }, text)
    )
  }
  const footer = props.appLink !== undefined || props.footer !== undefined
  return h(
    View,
    { onLayout, style: [styles.panel, props.style] },
    h(
      View,
      { style: landscape ? [styles.row, { gap: 16 }] : styles.steps },
      h(Readout, { roller, style: landscape ? styles.grow : undefined }),
      h(
        View,
        { style: [styles.steps, landscape ? styles.grow : null] },
        h(
          View,
          { style: styles.row },
          h(NotationField, {
            roller,
            ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })
          }),
          h(RollButton, { roller })
        ),
        h(StatusLine, { roller }),
        hasPresets
          ? h(
              View,
              { accessibilityRole: 'tablist', style: styles.tabs },
              tabButton('keys', 'Dice keys'),
              tabButton('presets', label)
            )
          : null,
        showPresets
          ? h(PresetList, { roller, presets, label, layout: props.presetsLayout ?? 'chips' })
          : h(KeyPad, { roller, keys: props.keys ?? DEFAULT_KEYS })
      )
    ),
    footer
      ? h(
          View,
          { style: styles.footer },
          props.appLink === undefined
            ? null
            : h(AppLink, { styles, href: props.appLink, label: 'Open the full app →' }),
          h(View, { style: styles.spacer }),
          props.footer
        )
      : null
  )
}

function HistoryList({
  styles,
  entries,
  onChoose
}: {
  readonly styles: RollerStyles
  readonly entries: readonly HistoryEntry[]
  readonly onChoose: (entry: HistoryEntry) => void
}): React.JSX.Element {
  if (entries.length === 0) return h(Text, { style: styles.recentEmpty }, EMPTY_HISTORY)
  return h(
    View,
    { style: styles.poolGroup },
    entries.map(entry =>
      h(
        Pressable,
        {
          key: entry.id,
          accessibilityRole: 'button',
          accessibilityLabel: `Roll ${entry.notation} again (last total ${entry.total})`,
          onPress: () => {
            onChoose(entry)
          },
          style: ({ pressed }: { readonly pressed: boolean }) => [
            styles.historyItem,
            pressed ? styles.pressed : null
          ]
        },
        h(
          View,
          { style: styles.historyText },
          h(Text, { style: styles.resultNotation }, entry.notation),
          h(Text, { style: styles.resultDesc, numberOfLines: 1 }, entry.description)
        ),
        h(Text, { style: styles.historyTotal }, entry.total)
      )
    )
  )
}

function Max({
  roller,
  styles,
  props,
  history,
  clearHistory
}: Shared & {
  readonly history: readonly HistoryEntry[]
  readonly clearHistory: () => void
}): React.JSX.Element {
  const [sheet, setSheet] = useState(false)
  const presets = props.presets ?? []
  const label = props.presetsLabel ?? 'Presets'
  const last = roller.result
  const again =
    last === null
      ? null
      : h(QuietButton, {
          styles,
          label: 'Roll again',
          onPress: () => {
            roller.choose(last)
          }
        })
  const choose = (entry: HistoryEntry): void => {
    setSheet(false)
    roller.choose(entry)
  }
  return h(
    View,
    { style: [styles.panel, props.style] },
    h(
      View,
      { accessibilityLabel: 'Build a roll', style: styles.steps },
      h(
        View,
        { style: styles.row },
        h(NotationField, {
          roller,
          ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })
        }),
        h(RollButton, { roller })
      ),
      h(StatusLine, { roller }),
      h(KeyPad, { roller, keys: props.keys ?? DEFAULT_KEYS }),
      presets.length > 0
        ? h(
            View,
            { style: styles.step },
            h(Text, { style: styles.stepLabel }, label),
            h(PresetList, { roller, presets, label })
          )
        : null
    ),
    h(Readout, { roller, actions: again, large: true }),
    props.history === false
      ? null
      : h(
          View,
          { accessibilityLabel: 'Recent rolls', style: styles.steps },
          h(
            View,
            { style: styles.recentHead },
            h(Text, { accessibilityRole: 'header', style: styles.recentTitle }, 'Recent'),
            h(QuietButton, {
              styles,
              label: 'History',
              onPress: () => {
                setSheet(true)
              }
            })
          ),
          h(HistoryList, { styles, entries: history.slice(0, RECENT), onChoose: choose }),
          h(
            Modal,
            {
              visible: sheet,
              animationType: 'slide',
              presentationStyle: 'pageSheet',
              onRequestClose: () => {
                setSheet(false)
              }
            },
            h(
              View,
              { style: styles.sheet },
              h(
                View,
                { style: styles.recentHead },
                h(Text, { accessibilityRole: 'header', style: styles.recentTitle }, 'History'),
                history.length > 0
                  ? h(QuietButton, { styles, label: 'Clear', onPress: clearHistory })
                  : null,
                h(QuietButton, {
                  styles,
                  label: 'Done',
                  onPress: () => {
                    setSheet(false)
                  }
                })
              ),
              h(ScrollView, null, h(HistoryList, { styles, entries: history, onChoose: choose }))
            )
          )
        )
  )
}

export function Roller(props: RollerProps): React.JSX.Element {
  const {
    size = 'compact',
    history: keepHistory = true,
    historyLimit = 50,
    initialHistory,
    onHistoryChange,
    onRoll
  } = props
  const { styles } = useStyles()
  const [history, setHistory] = useState<readonly HistoryEntry[]>(initialHistory ?? [])
  const latest = useRef({ size, keepHistory, historyLimit, onHistoryChange })
  latest.current = { size, keepHistory, historyLimit, onHistoryChange }

  const record = useCallback((result: RollResult) => {
    const now = latest.current
    if (now.size !== 'max' || !now.keepHistory) return
    setHistory(prev => {
      const entry: HistoryEntry = {
        // Unique even for two rolls in one millisecond
        id: Math.max(Date.now(), (prev[0]?.id ?? 0) + 1),
        notation: result.notation,
        total: result.total,
        description: result.description
      }
      return [entry, ...prev].slice(0, now.historyLimit)
    })
  }, [])

  // Told after each change, not for the history it started from
  const saved = useRef(history)
  useEffect(() => {
    if (saved.current === history) return
    saved.current = history
    latest.current.onHistoryChange?.(history)
  }, [history])

  const roller = useRoller({
    ...(props.defaultNotation === undefined ? {} : { defaultNotation: props.defaultNotation }),
    ...(props.notation === undefined ? {} : { notation: props.notation }),
    ...(props.onChange === undefined ? {} : { onChange: props.onChange }),
    ...(props.rollSignal === undefined ? {} : { rollSignal: props.rollSignal }),
    onRoll: result => {
      record(result)
      onRoll?.(result)
    }
  })

  const shared: Shared = { roller, styles, props }
  if (size === 'mini') return h(Mini, shared)
  if (size === 'max') {
    return h(Max, {
      ...shared,
      history,
      clearHistory: () => {
        setHistory([])
      }
    })
  }
  return h(Compact, shared)
}
