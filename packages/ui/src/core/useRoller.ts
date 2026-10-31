import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Token } from '@randsum/roller/tokenize'
import { tokenize } from '@randsum/roller/tokenize'
import { applyKey } from '../keys'
import type { Key } from '../keys'
import type { Preset } from '../presets'
import { checkNotation, rollNotation } from './check'
import type { NotationCheck, RollResult } from './check'

export interface RollerOptions {
  /** Starting notation when the roller manages its own value. */
  readonly defaultNotation?: string
  /** Controlled notation; pair it with onChange. */
  readonly notation?: string
  /** Fires on every edit: typing, a key, or a preset. */
  readonly onChange?: (notation: string) => void
  /** Fires after each roll with the full result. */
  readonly onRoll?: (result: RollResult) => void
  /** Each new value rolls the current notation, so a host can roll on demand. */
  readonly rollSignal?: number
}

export interface Roller {
  readonly notation: string
  readonly tokens: readonly Token[]
  readonly check: NotationCheck
  readonly result: RollResult | null
  readonly edit: (next: string) => void
  readonly roll: () => void
  readonly press: (key: Key) => void
  readonly choose: (preset: Preset) => void
}

export function useRoller({
  defaultNotation = '',
  notation: controlled,
  onChange,
  onRoll,
  rollSignal
}: RollerOptions): Roller {
  const [own, setOwn] = useState(defaultNotation)
  const [result, setResult] = useState<RollResult | null>(null)
  const notation = controlled ?? own
  const tokens = useMemo(() => tokenize(notation), [notation])
  const check = useMemo(() => checkNotation(notation), [notation])

  const edit = useCallback(
    (next: string) => {
      setOwn(next)
      onChange?.(next)
    },
    [onChange]
  )

  const rollThis = useCallback(
    (value: string) => {
      if (checkNotation(value).kind !== 'valid') return
      const rolled = rollNotation(value)
      if (rolled === null) return
      setResult(rolled)
      onRoll?.(rolled)
    },
    [onRoll]
  )

  const roll = useCallback(() => {
    rollThis(notation)
  }, [rollThis, notation])

  const press = useCallback(
    (key: Key) => {
      edit(applyKey(notation, key))
    },
    [edit, notation]
  )

  const choose = useCallback(
    (preset: Preset) => {
      edit(preset.notation)
      rollThis(preset.notation)
    },
    [edit, rollThis]
  )

  const lastSignal = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (rollSignal === undefined || rollSignal === lastSignal.current) return
    lastSignal.current = rollSignal
    rollThis(notation)
  }, [rollSignal, rollThis, notation])

  return { notation, tokens, check, result, edit, roll, press, choose }
}
