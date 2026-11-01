// Re-renders a native part whenever its RollerState changes, so a part stays
// current even when the component that holds the state does not re-render.
// Not a public entry.
import { useEffect, useReducer } from 'react'
import type { RollerState } from '../../roller-state'

export function useWatch(roller: RollerState): void {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => roller.subscribe(() => bump()), [roller])
}
