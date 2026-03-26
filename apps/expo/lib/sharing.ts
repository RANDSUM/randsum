import { Share } from 'react-native'

import type { ParsedRollResult } from './parseRollResult'

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

/**
 * Builds a URL with a ?n= query param for the given notation.
 * Web-only — call with a Platform.OS === 'web' guard at the call site.
 */
export function buildNotationUrl(notation: string): string {
  return `?n=${encodeURIComponent(notation)}`
}

/**
 * Copies the notation URL to the clipboard.
 * Web-only — call with a Platform.OS === 'web' guard at the call site.
 */
export async function copyLink(notation: string): Promise<void> {
  try {
    const url = `${window.location.origin}${window.location.pathname}${buildNotationUrl(notation)}`
    await navigator.clipboard.writeText(url)
  } catch {
    // Clipboard API unavailable — silently ignore
  }
}
