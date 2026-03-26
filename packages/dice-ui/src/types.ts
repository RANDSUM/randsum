import type { RollRecord } from '@randsum/roller'

export interface RollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}

export interface QuickReferenceGridProps {
  readonly onAdd: (fragment: string) => void
  readonly notation?: string
  readonly inverted?: boolean
  readonly selectedEntry?: string | null
  readonly onSelect?: (entryKey: string) => void
}
