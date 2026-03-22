import type { RollRecord } from '@randsum/roller'

export interface ParsedRollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}

/** Serialize a roll result for passing as an Expo Router route param or Zustand store. */
export function serializeRollResult(result: ParsedRollResult): string {
  return JSON.stringify(result)
}

/**
 * Deserialize a roll result from an Expo Router route param.
 * Returns null if the param is absent or malformed.
 */
export function parseRollResult(raw: string | string[] | undefined): ParsedRollResult | null {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as ParsedRollResult
  } catch {
    return null
  }
}
