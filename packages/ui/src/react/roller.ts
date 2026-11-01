// <Roller size="mini" | "compact" | "max">: <randsum-roller> for React.
import type React from 'react'
import { createElement, useEffect, useRef } from 'react'
import type { RollResult } from '../check'
import { detail, useElement, useLayoutEffectSafe } from '../internal/react'
import type { Key } from '../keys'
import type { Preset } from '../presets'
import type { RandsumRoller, RollerOrientation, RollerSize } from '../roller'
import type { PresetsLayout } from '../internal/parts/preset-list'
import '../roller'

export type { RollResult } from '../check'
export type { PresetsLayout } from '../internal/parts/preset-list'
export type { Key } from '../keys'
export type { Preset } from '../presets'
export type { RandsumRoller, RollerOrientation, RollerSize } from '../roller'

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
  /** Mini and Compact: a link to the full roller. */
  readonly appLink?: string
  /** Compact: extra footer content, after the app link. */
  readonly footer?: React.ReactNode
  /** Max: recent rolls and a History dialog. Defaults to true. */
  readonly history?: boolean
  /** Max: the localStorage key that keeps history across visits. */
  readonly storageKey?: string
  /** Max: how many rolls history keeps. Defaults to 50. */
  readonly historyLimit?: number
  readonly className?: string
}

export function Roller({
  size = 'compact',
  defaultNotation,
  notation,
  onChange,
  onRoll,
  rollSignal,
  footer,
  className,
  ...rest
}: RollerProps): React.JSX.Element {
  const { ref, element } = useElement<RandsumRoller>(rest, {
    'randsum-change': event => {
      onChange?.(detail<{ readonly notation: string }>(event).notation)
    },
    'randsum-roll': event => {
      onRoll?.(detail<RollResult>(event))
    }
  })

  // The notation is set only when the prop changes, so typing is not undone
  // by an unrelated render; the default is set once
  const initial = useRef(notation ?? defaultNotation)
  useLayoutEffectSafe(() => {
    const el = element.current
    const value = notation ?? initial.current
    if (el !== null && value !== undefined) el.notation = value
  }, [notation, element])

  // Runs after the properties are set, so a new notation and a new signal roll together
  const lastSignal = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (rollSignal === undefined || rollSignal === lastSignal.current) return
    lastSignal.current = rollSignal
    element.current?.roll()
  }, [rollSignal, element])

  return createElement(
    'randsum-roller',
    { ref, size, className },
    footer === undefined ? undefined : createElement('div', { slot: 'footer' }, footer)
  )
}
