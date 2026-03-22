import type { RollRecord } from '@randsum/roller'

export type { RollRecord }

/** Die sides available in Simple Mode */
export type DieSide = 4 | 6 | 8 | 10 | 12 | 20

/** A named variable in a template */
export interface Variable {
  readonly name: string
  readonly default?: number
  readonly label?: string
}

/** A saved roll template */
export interface RollTemplate {
  /** nanoid — generated with nanoid() before saving */
  readonly id: string
  readonly name: string
  /** Notation string, may include {variable} placeholders */
  readonly notation: string
  readonly variables: readonly Variable[]
  /** Optional game reference (e.g. 'blades') */
  readonly gameId?: string
  /** Saved game-specific input values */
  readonly gameInputs?: Readonly<Record<string, unknown>>
  /** ISO 8601 */
  readonly createdAt: string
  /** ISO 8601 */
  readonly updatedAt: string
}

/** A single entry in the roll history feed */
export interface RollHistoryEntry {
  /** nanoid */
  readonly id: string
  /** The notation that was rolled (e.g. "4d6L") */
  readonly notation: string
  readonly total: number
  /** Individual dice pool results from @randsum/roller */
  readonly rolls: readonly RollRecord[]
  /** Present when rolled via a game roller */
  readonly gameId?: string
  /** Present when rolled from a saved template */
  readonly templateId?: string
  /** ISO 8601 */
  readonly createdAt: string
}

/** User preferences */
export interface Preferences {
  readonly theme: 'dark' | 'light'
  /** Whether to fire haptic feedback on rolls (native only) */
  readonly haptics: boolean
  readonly defaultMode: 'simple' | 'advanced'
  /** ID of the last selected game, for restoring game tab state */
  readonly lastGameId?: string
  /** ISO 8601 — used by sync engine for last-write-wins merge */
  readonly updatedAt: string
}
