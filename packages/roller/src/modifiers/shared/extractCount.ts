/**
 * Sum numeric counts captured by a global regex across a notation string.
 *
 * For every match of `pattern` in `notation`, `match[1]` is parsed as a number and
 * added to the running total. If `match[1]` is missing (bare modifier like `H` or
 * `L`), `defaultCount` is used instead. If `defaultCount` is `undefined`, a missing
 * capture contributes `0`.
 *
 * Returns `undefined` when there are no matches. This lets callers skip setting
 * the associated option at all (preserving `exactOptionalPropertyTypes` semantics).
 *
 * The supplied `pattern` must have the `g` flag; `matchAll` throws otherwise.
 */
export function sumMatchCounts(
  notation: string,
  pattern: RegExp,
  defaultCount?: number
): number | undefined {
  const matches = Array.from(notation.matchAll(pattern))
  if (matches.length === 0) return undefined

  return matches.reduce((sum, match) => {
    const captured = match[1]
    if (captured !== undefined) return sum + Number(captured)
    return sum + (defaultCount ?? 0)
  }, 0)
}
