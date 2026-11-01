// The roller's state as a React hook, for building your own layout from the
// part components. Hand the returned state to each part as `roller`.
import { useEffect, useReducer, useRef, useState } from 'react'
import type { RollResult } from '../check'
import { RollerState } from '../roller-state'

export type { RollResult } from '../check'
export type { RollerState } from '../roller-state'

export interface RollerOptions {
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
}

/** One RollerState for the component's life; the component re-renders on each change. */
export function useRoller({
  defaultNotation = '',
  notation,
  onChange,
  onRoll,
  rollSignal
}: RollerOptions = {}): RollerState {
  const [state] = useState(() => new RollerState(notation ?? defaultNotation))
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const callbacks = useRef({ onChange, onRoll })
  callbacks.current = { onChange, onRoll }

  useEffect(
    () =>
      state.subscribe(event => {
        bump()
        if (event.type === 'change') callbacks.current.onChange?.(event.notation)
        if (event.type === 'roll') callbacks.current.onRoll?.(event.result)
      }),
    [state]
  )

  useEffect(() => {
    if (notation !== undefined) state.set(notation)
  }, [state, notation])

  const lastSignal = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (rollSignal === undefined || rollSignal === lastSignal.current) return
    lastSignal.current = rollSignal
    state.roll()
  }, [state, rollSignal])

  return state
}
