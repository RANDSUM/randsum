import { NotationParseError } from '../../errors'
import { parseNotation } from '../lexer/parse'
import type { ParseResult } from '../lexer/parse'
import type { ParsedNotationOptions } from '../types'
import { poolToOptions } from './poolToOptions'

/**
 * Upper bound for a single repeat operator (`xN`).
 * Protects against oversized result arrays from a single `xN` operator.
 */
export const MAX_REPEAT_COUNT = 1000

/**
 * Upper bound for how many nested `xN` operators may appear in one notation.
 * Protects against exponential blow-up like `1d6x10x10x10...` chains.
 */
export const MAX_REPEAT_DEPTH = 10

/**
 * Build options from a parse the caller already ran, so `roll()` and
 * `validateNotation` read each string once. Throws `NotationParseError` (with
 * the parser's position) when the parse failed or a repeat exceeds its bounds.
 *
 * A trailing repeat run applies to the whole expression; each `xN` wraps
 * everything to its left, so they are checked outermost (rightmost) first.
 */
export function parsedToOptions(
  notationString: string,
  parsed: ParseResult
): ParsedNotationOptions[] {
  if (!parsed.valid) {
    throw new NotationParseError(
      notationString,
      parsed.error?.message ?? 'Invalid notation',
      undefined,
      parsed.error ? { position: parsed.error.position } : undefined
    )
  }

  const outermostFirst = [...parsed.repeats].reverse()
  outermostFirst.forEach(({ count, position }, depth) => {
    if (depth >= MAX_REPEAT_DEPTH) {
      throw new NotationParseError(
        notationString,
        `repeat nesting depth exceeds maximum of ${MAX_REPEAT_DEPTH}`,
        undefined,
        { position }
      )
    }
    if (count > MAX_REPEAT_COUNT) {
      throw new NotationParseError(
        notationString,
        `repeat count ${count} exceeds maximum of ${MAX_REPEAT_COUNT}`,
        undefined,
        { position, value: count }
      )
    }
  })

  return parsed.repeats.reduce<ParsedNotationOptions[]>(
    (options, { count }) => Array.from({ length: count }, () => options).flat(),
    parsed.pools.map(poolToOptions)
  )
}

/**
 * Parse a notation string into one options object per pool. Throws
 * `NotationParseError` on invalid notation; check with `isDiceNotation` first
 * to branch instead.
 */
export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  return parsedToOptions(notationString, parseNotation(notationString))
}
