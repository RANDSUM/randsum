import { NotationParseError } from '../../errors'
import { MAX_NOTATION_LENGTH, parseNotation } from '../lexer/parse'
import type { PoolNode } from '../lexer/parse'
import type { ParsedDieType, ParsedNotationOptions } from '../types'
import { parseSpecialPoolSegment } from './parseSpecialPool'
import { singleNotationToOptions } from './singleNotationToOptions'

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

const repeatPattern = /[Xx]([1-9]\d*)$/

function parseRepeat(input: string): { base: string; count: number; position: number } | null {
  const match = repeatPattern.exec(input)
  if (!match) return null
  return { base: input.slice(0, match.index), count: Number(match[1]), position: match.index }
}

/**
 * Reconstruct a single-pool segment string WITHOUT the leading sign (core +
 * modifiers + annotation). The sign drives `arithmetic` separately so it never
 * leaks into the rendered notation (e.g. the `1d8` pool of `1d20-1d8` keeps the
 * notation `1d8`, not `-1d8`).
 */
function segmentString(node: PoolNode): string {
  return `${node.body}${node.modifiersText}${node.label !== undefined ? `[${node.label}]` : ''}`
}

/**
 * Build options for a special die pool WITHOUT losing its face semantics.
 * (Historically this data was dropped and every special die parsed as a plain
 * numeric pool — the core bug this rewrite fixes.)
 */
function specialPoolToOptions(node: PoolNode): ParsedNotationOptions {
  const special = parseSpecialPoolSegment(node.text)
  // A valid special pool node always parses; fall back defensively if not.
  if (special === null) return singleNotationToOptions(segmentString(node))

  const dieType: ParsedDieType = special.kind
  const options: ParsedNotationOptions = {
    quantity: special.quantity,
    arithmetic: special.arithmetic,
    sides: special.sides,
    dieType
  }
  if (special.fateVariant !== undefined) options.fateVariant = special.fateVariant
  if (special.customFaces !== undefined) options.customFaces = special.customFaces
  if (node.label !== undefined) options.label = node.label
  return options
}

function poolToOptions(node: PoolNode): ParsedNotationOptions {
  // Percentile is a plain d100 pool (numeric sides), matching roll().
  if (node.kind === 'percentile' && !node.hasModifiers) {
    const special = parseSpecialPoolSegment(node.text)
    if (special !== null) {
      const options: ParsedNotationOptions = {
        quantity: special.quantity,
        arithmetic: special.arithmetic,
        sides: 100,
        dieType: 'percentile'
      }
      if (node.label !== undefined) options.label = node.label
      return options
    }
  }
  // Special dice without modifiers keep their die-type semantics.
  if (node.kind !== 'standard' && node.kind !== 'percentile' && !node.hasModifiers) {
    return specialPoolToOptions(node)
  }
  // Standard pools (and special dice carrying modifiers, which roller rejects at
  // roll time) go through the lenient single-pool parser, preserving behavior.
  // The sign was stripped by segmentString, so re-apply arithmetic from the node.
  const options = singleNotationToOptions(segmentString(node))
  if (node.sign === '-') options.arithmetic = 'subtract'
  return options
}

function notationToOptionsInternal(notationString: string, depth: number): ParsedNotationOptions[] {
  if (notationString.length > MAX_NOTATION_LENGTH) {
    throw new NotationParseError(
      notationString,
      `notation exceeds maximum length of ${MAX_NOTATION_LENGTH} characters`,
      undefined,
      { position: MAX_NOTATION_LENGTH }
    )
  }

  const repeat = parseRepeat(notationString)
  if (repeat) {
    if (depth >= MAX_REPEAT_DEPTH) {
      throw new NotationParseError(
        notationString,
        `repeat nesting depth exceeds maximum of ${MAX_REPEAT_DEPTH}`,
        undefined,
        { position: repeat.position }
      )
    }
    if (repeat.count > MAX_REPEAT_COUNT) {
      throw new NotationParseError(
        notationString,
        `repeat count ${repeat.count} exceeds maximum of ${MAX_REPEAT_COUNT}`,
        undefined,
        { position: repeat.position, value: repeat.count }
      )
    }
    const baseOptions = notationToOptionsInternal(repeat.base, depth + 1)
    return Array.from({ length: repeat.count }, () => baseOptions).flat()
  }

  const parsed = parseNotation(notationString)
  if (!parsed.valid) {
    // Lenient fallback for structurally-invalid-but-parseable input (e.g. `0d0`).
    // These still produce options; the roll pipeline rejects them downstream,
    // exactly as before this rewrite.
    return [singleNotationToOptions(notationString)]
  }

  return parsed.pools.map(poolToOptions)
}

export function notationToOptions(notationString: string): ParsedNotationOptions[] {
  return notationToOptionsInternal(notationString, 0)
}
