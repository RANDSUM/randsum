import { SchemaError } from './errors'
import type { NormalizedOutcome, NormalizedRollDefinition, NormalizedSpec } from './normalizedTypes'
import type { IntegerOrInput, ModifyOperation, TableRange } from './types'

/**
 * Inclusive integer range [min, max]. When min > max, the range is empty.
 */
interface IntRange {
  readonly min: number
  readonly max: number
}

function rangeOf(val: number): IntRange {
  return { min: val, max: val }
}

/**
 * Resolve the possible value range of an `IntegerOrInput`. Returns undefined
 * if the range cannot be determined (e.g. unbounded `$input` reference with
 * no declared `minimum`/`maximum`).
 */
function resolveIntegerOrInput(
  value: IntegerOrInput,
  inputs: NormalizedRollDefinition['inputs']
): IntRange | undefined {
  if (typeof value === 'number') return rangeOf(value)

  if ('ifTrue' in value && 'ifFalse' in value) {
    return {
      min: Math.min(value.ifTrue, value.ifFalse),
      max: Math.max(value.ifTrue, value.ifFalse)
    }
  }

  const decl = inputs?.[value.$input]
  if (!decl) return undefined
  if (decl.type !== 'integer') return undefined

  const declaredDefault = typeof decl.default === 'number' ? decl.default : undefined

  const min = decl.minimum ?? declaredDefault
  const max = decl.maximum ?? declaredDefault
  if (min === undefined || max === undefined) return undefined
  return { min, max }
}

/**
 * Compute the possible total range produced by Stage 1 (dice) and
 * Stage 2 (modify) of a single-pool roll that resolves via `sum`.
 *
 * Returns undefined for resolve strategies, pool shapes, or modifier
 * stacks that the simple analysis doesn't cover. Callers should treat
 * `undefined` as "skip coverage check for this outcome".
 */
function computeSinglePoolRange(
  rollDef: NormalizedRollDefinition,
  modify: readonly ModifyOperation[]
): IntRange | undefined {
  // Only 'sum' resolve is analyzable at this stage.
  if (rollDef.resolve !== 'sum') return undefined

  // dicePools / remote / compare strategies are out of scope here.
  if (rollDef.dicePools !== undefined) return undefined
  if (rollDef.dice === undefined) return undefined

  // Array dice (multi-pool via dice array) — skip for now. A single DiceConfig
  // has a `pool` property; an array of configs does not.
  const dc = 'pool' in rollDef.dice ? rollDef.dice : undefined
  if (dc === undefined) return undefined
  const pool = dc.pool

  const sidesRange = resolveIntegerOrInput(pool.sides, rollDef.inputs)
  const quantitySource = dc.quantity ?? pool.quantity
  const quantityRange =
    quantitySource === undefined
      ? rangeOf(1)
      : resolveIntegerOrInput(quantitySource, rollDef.inputs)

  if (!sidesRange || !quantityRange) return undefined
  if (sidesRange.min < 1 || quantityRange.min < 0) return undefined

  // Raw sum range: each die contributes [1, sides]. Across `quantity` dice:
  //   min total = quantity.min * 1
  //   max total = quantity.max * sides.max
  const initial: IntRange = {
    min: quantityRange.min * 1,
    max: quantityRange.max * sidesRange.max
  }

  // Apply modify-stage operators. We fold through a reducer that either returns
  // a new IntRange or `undefined` to signal "can't analyze — skip coverage".
  type Acc = { readonly range: IntRange } | { readonly bail: true }
  const modified = modify.reduce<Acc>(
    (acc, op) => {
      if ('bail' in acc) return acc
      const cur = acc.range

      if (op.keepHighest !== undefined) {
        const keep = resolveIntegerOrInput(op.keepHighest, rollDef.inputs)
        if (!keep) return { bail: true }
        // Keep N highest: each kept die is [1, sides.max].
        return { range: { min: keep.min * 1, max: keep.max * sidesRange.max } }
      }
      if (op.keepLowest !== undefined) {
        const keep = resolveIntegerOrInput(op.keepLowest, rollDef.inputs)
        if (!keep) return { bail: true }
        return { range: { min: keep.min * 1, max: keep.max * sidesRange.max } }
      }
      if (op.add !== undefined) {
        const addRange = resolveIntegerOrInput(op.add, rollDef.inputs)
        if (!addRange) return { bail: true }
        // `add` in modify stage is accumulated into the roller's `plus`
        // option, which is a total-level offset (see emitModifiers.ts).
        // Widen the range by addRange once.
        return { range: { min: cur.min + addRange.min, max: cur.max + addRange.max } }
      }
      // cap / markDice / keepMarked / unknown — skip analysis.
      return { bail: true }
    },
    { range: initial }
  )

  if ('bail' in modified) return undefined

  // postResolveModifiers: fold through add-only shifts.
  const final = (rollDef.postResolveModifiers ?? []).reduce<Acc>((acc, op) => {
    if ('bail' in acc) return acc
    if (op.add === undefined) return acc
    const addRange = resolveIntegerOrInput(op.add, rollDef.inputs)
    if (!addRange) return { bail: true }
    return {
      range: { min: acc.range.min + addRange.min, max: acc.range.max + addRange.max }
    }
  }, modified)

  if ('bail' in final) return undefined
  return final.range
}

/**
 * Extract non-conditional value ranges from an outcome. Ranges gated by a
 * `poolCondition` don't guarantee coverage and are excluded.
 */
function extractValueRanges(ranges: readonly TableRange[]): IntRange[] {
  const out: IntRange[] = []
  for (const range of ranges) {
    if (range.poolCondition !== undefined) continue
    if (range.exact !== undefined) {
      out.push(rangeOf(range.exact))
      continue
    }
    // After Gap 4 the schema permits min-alone and max-alone. Treat those as
    // half-open intervals extending to the pool bounds; that logic lives in
    // findUncoveredGaps below. Here we collect whatever's specified.
    const min = range.min ?? Number.NEGATIVE_INFINITY
    const max = range.max ?? Number.POSITIVE_INFINITY
    out.push({ min, max })
  }
  return out
}

/**
 * Given a pool range [poolMin, poolMax] and a set of covered ranges,
 * return the list of integer sub-ranges within the pool that remain
 * uncovered.
 */
function findUncoveredGaps(pool: IntRange, covered: readonly IntRange[]): IntRange[] {
  // Clip each covered range to the pool bounds; drop empties.
  const clipped: IntRange[] = []
  for (const c of covered) {
    const lo = Math.max(c.min, pool.min)
    const hi = Math.min(c.max, pool.max)
    if (lo <= hi) clipped.push({ min: lo, max: hi })
  }

  // Sort and merge.
  clipped.sort((a, b) => a.min - b.min)
  const merged: IntRange[] = []
  for (const r of clipped) {
    const last = merged[merged.length - 1]
    if (last !== undefined && r.min <= last.max + 1) {
      merged[merged.length - 1] = { min: last.min, max: Math.max(last.max, r.max) }
    } else {
      merged.push(r)
    }
  }

  const gaps: IntRange[] = []
  const finalCursor = merged.reduce((cursor, r) => {
    if (r.min > cursor) gaps.push({ min: cursor, max: r.min - 1 })
    return Math.max(cursor, r.max + 1)
  }, pool.min)
  if (finalCursor <= pool.max) gaps.push({ min: finalCursor, max: pool.max })

  return gaps
}

function formatRange(r: IntRange): string {
  if (r.min === r.max) return String(r.min)
  return `${String(r.min)}..${String(r.max)}`
}

function getOutcomeRanges(outcome: NormalizedOutcome | undefined): readonly TableRange[] {
  if (!outcome) return []
  if ('ranges' in outcome) return outcome.ranges
  if ('tableLookup' in outcome) return outcome.tableLookup.ranges
  return []
}

function validateOutcome(
  outcome: NormalizedOutcome | undefined,
  poolRange: IntRange | undefined,
  specPath: string
): void {
  if (outcome === undefined) return
  if ('degreeOfSuccess' in outcome) return
  if (poolRange === undefined) return

  const ranges = getOutcomeRanges(outcome)
  if (ranges.length === 0) return

  const gaps = findUncoveredGaps(poolRange, extractValueRanges(ranges))
  if (gaps.length === 0) return

  const gapStr = gaps.map(formatRange).join(', ')
  throw new SchemaError(
    `Outcome ranges at ${specPath} do not cover pool total ${formatRange(poolRange)}: missing ${gapStr}. ` +
      `Add a range with matching min/max, or widen an existing range to include these totals.`,
    'INVALID_SPEC'
  )
}

/**
 * Validate that every outcome in the spec covers the full possible range
 * of totals its pool can produce. Throws SchemaError on the first gap.
 *
 * Scope (first pass): single-pool rolls with `sum` resolve. More complex
 * shapes (dicePools, comparePool, remoteTableLookup, countMatching, array
 * dice, cap/mark modifiers) are skipped — the analyzer returns undefined
 * for the pool range and the outcome is not checked.
 */
export function validateRangeCoverage(nspec: NormalizedSpec): void {
  for (const [rollKey, rollDef] of Object.entries(nspec.rolls)) {
    const baseModify = rollDef.modify ?? []
    const baseRange = computeSinglePoolRange(rollDef, baseModify)
    validateOutcome(rollDef.outcome, baseRange, `${nspec.shortcode}.${rollKey}.outcome`)

    for (const [index, rollCase] of (rollDef.when ?? []).entries()) {
      const override = rollCase.override
      const effectiveModify = override.modify ?? baseModify
      // Build an effective rollDef that reflects the override shape.
      const effectiveRollDef: NormalizedRollDefinition = {
        ...rollDef,
        ...(override.dice !== undefined ? { dice: override.dice } : {}),
        ...(override.resolve !== undefined ? { resolve: override.resolve } : {}),
        ...(override.postResolveModifiers !== undefined
          ? { postResolveModifiers: override.postResolveModifiers }
          : {}),
        modify: effectiveModify
      }
      const caseRange = computeSinglePoolRange(effectiveRollDef, effectiveModify)
      const effectiveOutcome = override.outcome ?? rollDef.outcome
      validateOutcome(
        effectiveOutcome,
        caseRange,
        `${nspec.shortcode}.${rollKey}.when[${String(index)}].outcome`
      )
    }
  }
}
