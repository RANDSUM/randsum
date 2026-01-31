/**
 * Detects common typos in dice notation and suggests corrections.
 */

/**
 * Detects common typos in dice notation.
 */

/**
 * Fixes missing 'd' separator (e.g., "46" -> "4d6").
 */
function fixMissingSeparator(notation: string): string | undefined {
  const match = /^(\d+)(\d+)/.exec(notation)
  if (match?.[1] && match[2]) {
    const first = match[1]
    const second = match[2]
    // Only suggest if both parts are reasonable (1-100 for quantity, 2-1000 for sides)
    if (
      Number.parseInt(first, 10) <= 100 &&
      Number.parseInt(second, 10) >= 2 &&
      Number.parseInt(second, 10) <= 1000
    ) {
      return `${first}d${second}`
    }
  }
  return undefined
}

/**
 * Fixes missing quantity (e.g., "d6" -> "1d6").
 */
function fixMissingQuantity(notation: string): string | undefined {
  if (/^[dD]\d+/.test(notation)) {
    return notation.replace(/^[dD]/, '1d')
  }
  return undefined
}

/**
 * Fixes extra spaces (e.g., "4 d 6" -> "4d6").
 */
function fixExtraSpaces(notation: string): string | undefined {
  const fixed = notation.replace(/\s+/g, '')
  if (fixed !== notation && /^\d+[dD]\d+/.test(fixed)) {
    return fixed
  }
  return undefined
}

/**
 * Detects common typos in dice notation.
 *
 * @param notation - Invalid notation to check
 * @returns Suggested correction, or undefined if no suggestion
 */
export function suggestNotationFix(notation: string): string | undefined {
  const trimmed = notation.trim()

  // Try fixing missing quantity (d6 -> 1d6)
  const missingQty = fixMissingQuantity(trimmed)
  if (missingQty) {
    return missingQty
  }

  // Try fixing extra spaces (4 d 6 -> 4d6)
  const fixedSpaces = fixExtraSpaces(trimmed)
  if (fixedSpaces) {
    return fixedSpaces
  }

  // Try fixing missing separator (46 -> 4d6)
  const missingSep = fixMissingSeparator(trimmed)
  if (missingSep) {
    return missingSep
  }

  // Check for common valid patterns that might be close
  const validPattern = /^(\d+)d(\d+)/i
  const coreMatch = validPattern.exec(trimmed)
  if (coreMatch?.[0]) {
    // Notation has valid core, might just have modifier issues
    // Return the core part as a suggestion
    return coreMatch[0]
  }

  // Check if it looks like dice notation but missing something
  if (/^\d+/.test(trimmed) && !trimmed.includes('d') && !trimmed.includes('D')) {
    // Has numbers but no 'd' - might be missing separator
    const numMatch = /^(\d+)(\d+)/.exec(trimmed)
    if (numMatch?.[1] && numMatch[2]) {
      return `${numMatch[1]}d${numMatch[2]}`
    }
  }

  return undefined
}
