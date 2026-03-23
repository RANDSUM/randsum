import { Share } from 'react-native'

import type { ParsedRollResult } from './parseRollResult'
import type { RollTemplate } from './types'

/**
 * Formats a ParsedRollResult as a human-readable string.
 * Dropped dice are wrapped in brackets: "Rolled 4d6L → 15 (6, 5, 4, [1])"
 */
export function formatRollResultText(result: ParsedRollResult): string {
  const allDice = result.records.flatMap(record => {
    const keptSet = new Set(record.rolls)
    return record.initialRolls.map(v => ({
      value: v,
      dropped: !keptSet.has(v)
    }))
  })

  const diceText = allDice.map(d => (d.dropped ? `[${d.value}]` : String(d.value))).join(', ')

  const breakdown = diceText.length > 0 ? ` (${diceText})` : ''
  return `Rolled ${result.notation} → ${result.total}${breakdown}`
}

/** Share a roll result via the system share sheet. */
export async function shareRollResult(result: ParsedRollResult): Promise<void> {
  const message = formatRollResultText(result)
  try {
    await Share.share({ message })
  } catch {
    // Share API unavailable or dismissed — silently ignore
  }
}

/** Share a template via the system share sheet with a deep link URL. */
export async function shareTemplate(template: RollTemplate, templateUrl: string): Promise<void> {
  try {
    await Share.share({ message: templateUrl, url: templateUrl })
  } catch {
    // Share API unavailable or dismissed — silently ignore
  }
}
