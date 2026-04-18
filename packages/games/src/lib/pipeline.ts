import { roll } from '@randsum/roller/roll'
import { validateFinite, validateRange } from '@randsum/roller/validate'
import type { RollOptions, RollRecord } from '@randsum/roller'

import { compareValues, evaluateNormalizedWhen } from './conditionEvaluator'
import { SchemaError } from './errors'
import { bindInteger } from './inputBinder'
import { type ManualOp, translateModifiers } from './modifierTranslator'
import type {
  NormalizedDetailsFieldDef,
  NormalizedDetailsLeafDef,
  NormalizedDiceConfig,
  NormalizedOutcome,
  NormalizedResolveOperation,
  NormalizedRollDefinition
} from './normalizedTypes'
import type {
  ComparePoolOperation,
  Condition,
  DegreeOfSuccessOperation,
  GameRollResult,
  InputDeclaration,
  InputValue,
  PoolCondition,
  PostResolveModifyOperation,
  RollInput,
  TableRange
} from './types'

function applyInputDefaults(
  input: RollInput,
  inputs: Readonly<Record<string, InputDeclaration>> | undefined
): RollInput {
  if (!inputs) return input
  return Object.entries(inputs).reduce((acc, [key, decl]) => {
    if (acc[key] !== undefined || decl.default === undefined) return acc
    return { ...acc, [key]: decl.default }
  }, input)
}

function evaluateCondition(condition: Condition, input: RollInput): boolean {
  const inputVal = input[condition.input]
  if (inputVal === undefined) return false
  if (condition.operator === '=') return inputVal === condition.value
  if (typeof inputVal !== 'number' || typeof condition.value !== 'number') return false
  switch (condition.operator) {
    case '>':
      return inputVal > condition.value
    case '>=':
      return inputVal >= condition.value
    case '<':
      return inputVal < condition.value
    case '<=':
      return inputVal <= condition.value
    default:
      return false
  }
}

function buildSingleRollOptions(
  diceConfig: NormalizedDiceConfig,
  mergedInput: RollInput,
  rollerOptions: ReturnType<typeof translateModifiers>['rollerOptions']
): RollOptions {
  const pool = diceConfig.pool
  const sides = bindInteger(pool.sides, mergedInput)
  const quantitySource = diceConfig.quantity ?? pool.quantity
  const quantity = quantitySource !== undefined ? bindInteger(quantitySource, mergedInput) : 1
  const hasModifiers = Object.keys(rollerOptions).length > 0

  if (diceConfig.key !== undefined && hasModifiers) {
    return { sides, quantity, modifiers: rollerOptions, key: diceConfig.key }
  }
  if (hasModifiers) {
    return { sides, quantity, modifiers: rollerOptions }
  }
  if (diceConfig.key !== undefined) {
    return { sides, quantity, key: diceConfig.key }
  }
  return { sides, quantity }
}

function buildRollOptionsArray(
  dice: NormalizedDiceConfig | readonly NormalizedDiceConfig[],
  mergedInput: RollInput,
  rollerOptions: ReturnType<typeof translateModifiers>['rollerOptions']
): RollOptions[] {
  if (Array.isArray(dice)) {
    return (dice as readonly NormalizedDiceConfig[]).map(dc =>
      buildSingleRollOptions(dc, mergedInput, rollerOptions)
    )
  }
  return [buildSingleRollOptions(dice as NormalizedDiceConfig, mergedInput, rollerOptions)]
}

function applyManualModifiers(
  rolls: readonly number[],
  manualOps: readonly ManualOp[]
): readonly number[] {
  if (manualOps.length === 0) return rolls

  interface MarkedDie {
    readonly value: number
    readonly flags: Set<string>
  }

  return manualOps
    .reduce(
      (acc: readonly MarkedDie[], op): readonly MarkedDie[] => {
        if (op.type === 'markDice') {
          return acc.map(
            (die): MarkedDie => ({
              value: die.value,
              flags: compareValues(die.value, op.operator, op.value)
                ? new Set([...die.flags, op.flag])
                : die.flags
            })
          )
        }
        return acc.filter(d => d.flags.has(op.flag))
      },
      rolls.map((v): MarkedDie => ({ value: v, flags: new Set<string>() }))
    )
    .map(d => d.value)
}

function evaluatePoolCondition(
  condition: PoolCondition,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): boolean {
  const pool = condition.pool === 'postModify' ? workingRolls : preModifyRolls
  const matchCount = pool.filter(v =>
    compareValues(v, condition.countWhere.operator, bindInteger(condition.countWhere.value, input))
  ).length
  if (condition.atLeast !== undefined) {
    return matchCount >= bindInteger(condition.atLeast, input)
  }
  if (condition.atLeastRatio !== undefined) {
    return pool.length > 0 && matchCount / pool.length >= condition.atLeastRatio
  }
  return false
}

function lookupRanges(
  total: number,
  ranges: readonly TableRange[],
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): string {
  for (const range of ranges) {
    const poolMatch =
      range.poolCondition === undefined ||
      evaluatePoolCondition(range.poolCondition, preModifyRolls, workingRolls, input)
    // Value-match semantics, aligned with the emitter (emitOutcome.ts:70-80):
    //   exact           → total === exact
    //   min + max       → min <= total <= max
    //   min alone       → total >= min
    //   max alone       → total <= max
    //   no value part   → matches when poolCondition matches
    const hasValueConstraint =
      range.exact !== undefined || range.min !== undefined || range.max !== undefined
    const valueMatch = hasValueConstraint
      ? (range.exact === undefined || total === range.exact) &&
        (range.min === undefined || total >= range.min) &&
        (range.max === undefined || total <= range.max)
      : range.poolCondition !== undefined
    if (poolMatch && valueMatch) return range.result
  }
  throw new SchemaError(`No table entry matches total ${total}`, 'NO_TABLE_MATCH')
}

function applyDegreeOfSuccess(total: number, degrees: DegreeOfSuccessOperation): string {
  const candidates: [string, number][] = []
  if (degrees.criticalSuccess !== undefined) {
    candidates.push(['criticalSuccess', degrees.criticalSuccess])
  }
  if (degrees.success !== undefined) {
    candidates.push(['success', degrees.success])
  }
  if (degrees.failure !== undefined) {
    candidates.push(['failure', degrees.failure])
  }
  if (degrees.criticalFailure !== undefined) {
    candidates.push(['criticalFailure', degrees.criticalFailure])
  }

  candidates.sort((a, b) => b[1] - a[1])

  for (const [name, threshold] of candidates) {
    if (total >= threshold) return name
  }

  throw new SchemaError(`No degree of success matches total ${total}`, 'NO_TABLE_MATCH')
}

function resolveTotal(
  rolls: readonly number[],
  resolve: NormalizedResolveOperation,
  input: RollInput
): number {
  if (resolve === 'sum') {
    return rolls.reduce((sum, v) => sum + v, 0)
  }
  if (typeof resolve === 'object' && 'countMatching' in resolve) {
    const { operator, value } = resolve.countMatching
    const threshold = bindInteger(value, input)
    return rolls.filter(v => compareValues(v, operator, threshold)).length
  }
  // tableLookup in resolve: sum the dice (lookup is handled in outcome)
  return rolls.reduce((sum, v) => sum + v, 0)
}

function applyPostResolveModifiers(
  total: number,
  postResolveModifiers: readonly PostResolveModifyOperation[] | undefined,
  input: RollInput
): number {
  if (!postResolveModifiers || postResolveModifiers.length === 0) return total
  return postResolveModifiers.reduce((acc, op) => {
    if (op.add !== undefined) return acc + bindInteger(op.add, input)
    return acc
  }, total)
}

function rollSinglePool(
  diceConfig: NormalizedDiceConfig,
  mergedInput: RollInput
): { readonly total: number; readonly rolls: readonly RollRecord[] } {
  const opts = buildSingleRollOptions(diceConfig, mergedInput, {})
  const result = roll(opts)
  const poolTotal = result.rolls.flatMap((r: RollRecord) => r.rolls).reduce((s, v) => s + v, 0)
  return { total: poolTotal, rolls: result.rolls }
}

function applyComparePool(
  poolResults: Readonly<Record<string, { readonly total: number }>>,
  op: ComparePoolOperation
): string {
  const [keyA, keyB] = op.pools
  const a = poolResults[keyA]?.total ?? 0
  const b = poolResults[keyB]?.total ?? 0

  if (a === b) return op.ties ?? `${keyA}=${keyB}`
  const winner = a > b ? keyA : keyB
  return op.outcomes[winner] ?? winner
}

function resolveCompareResult(
  resolve: NormalizedResolveOperation,
  poolResults: Readonly<Record<string, { readonly total: number }>>
): string {
  if (typeof resolve === 'object' && 'comparePoolHighest' in resolve) {
    return applyComparePool(poolResults, resolve.comparePoolHighest)
  }
  if (typeof resolve === 'object' && 'comparePoolSum' in resolve) {
    return applyComparePool(poolResults, resolve.comparePoolSum)
  }
  return String(Object.values(poolResults).reduce((s, p) => s + p.total, 0))
}

function applyOutcome(
  total: number,
  outcome: NormalizedOutcome | undefined,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): string | number {
  if (outcome === undefined) return total

  const numeric = outcome.resultShape === 'numeric'

  if ('ranges' in outcome) {
    const label = lookupRanges(total, outcome.ranges, preModifyRolls, workingRolls, input)
    return numeric ? total : label
  }
  if ('degreeOfSuccess' in outcome) {
    const label = applyDegreeOfSuccess(total, outcome.degreeOfSuccess)
    return numeric ? total : label
  }
  if ('tableLookup' in outcome) {
    const label = lookupRanges(
      total,
      outcome.tableLookup.ranges,
      preModifyRolls,
      workingRolls,
      input
    )
    return numeric ? total : label
  }

  return String(total)
}

function validateInputs(
  rollDef: NormalizedRollDefinition,
  input: RollInput,
  specName: string
): void {
  if (!rollDef.inputs) return
  for (const [fieldName, decl] of Object.entries(rollDef.inputs)) {
    const val = input[fieldName]
    if (val === undefined) continue

    if (decl.type === 'integer' && typeof val === 'number') {
      const label = decl.description ?? `${specName} ${fieldName}`
      validateFinite(val, label)
      if (decl.minimum !== undefined && decl.maximum !== undefined) {
        validateRange(val, decl.minimum, decl.maximum, label)
      }
    }

    if (
      decl.type === 'string' &&
      decl.enum !== undefined &&
      decl.enum.length > 0 &&
      !decl.enum.includes(val as string)
    ) {
      const enumList = decl.enum.map(v => `'${v}'`).join(' or ')
      throw new SchemaError(
        `Invalid ${fieldName} value: ${String(val)}. Must be ${enumList}.`,
        'INVALID_INPUT_TYPE'
      )
    }
  }
}

interface DetailsContext {
  readonly input: RollInput
  readonly diceTotal: number
  readonly total: number
  readonly poolTotals: Readonly<Record<string, number>>
  readonly conditionalPoolTotals: Readonly<Record<string, number>>
  readonly rolls: readonly RollRecord[]
}

function resolveLeaf(leaf: NormalizedDetailsLeafDef, ctx: DetailsContext): InputValue | undefined {
  if ('expr' in leaf) return leaf.expr === 'diceTotal' ? ctx.diceTotal : ctx.total
  if ('$pool' in leaf) return ctx.poolTotals[leaf.$pool] ?? 0
  if ('$conditionalPool' in leaf) return ctx.conditionalPoolTotals[leaf.$conditionalPool] ?? 0
  if ('$dieCheck' in leaf) {
    const dc = leaf.$dieCheck
    const record = ctx.rolls[dc.pool]
    if (record === undefined) return false
    const dieValues = dc.field === 'final' ? record.rolls : record.initialRolls
    const dieValue = dieValues[dc.die]
    if (dieValue === undefined) return false
    const opMap: Record<string, (a: number, b: number) => boolean> = {
      '=': (a, b) => a === b,
      '>': (a, b) => a > b,
      '>=': (a, b) => a >= b,
      '<': (a, b) => a < b,
      '<=': (a, b) => a <= b
    }
    const compare = opMap[dc.operator] ?? ((a: number, b: number) => a === b)
    return compare(dieValue, dc.value)
  }
  const val = ctx.input[leaf.$input]
  if (val !== undefined) return val
  if (leaf.default !== undefined) return leaf.default
  return undefined
}

function buildDetails(
  detailsDef: Readonly<Record<string, NormalizedDetailsFieldDef>>,
  ctx: DetailsContext
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  for (const [fieldName, def] of Object.entries(detailsDef)) {
    switch (def.kind) {
      case 'leaf':
        result[fieldName] = resolveLeaf(def.def, ctx)
        break
      case 'conditional': {
        const condVal = ctx.input[def.when.input]
        if (condVal === undefined) {
          result[fieldName] = undefined
        } else {
          const nested: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(def.fields)) {
            nested[k] = resolveLeaf(v, ctx)
          }
          result[fieldName] = nested
        }
        break
      }
      case 'nested': {
        const nested: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(def.fields)) {
          nested[k] = resolveLeaf(v, ctx)
        }
        result[fieldName] = nested
        break
      }
    }
  }
  return result
}

export function executePipeline(
  rollDef: NormalizedRollDefinition,
  input: RollInput,
  specName: string
): GameRollResult<string | number, Readonly<Record<string, unknown>> | undefined, RollRecord> {
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    throw new SchemaError(
      'Spec uses remoteTableLookup which requires async execution. Use loadSpecAsync() instead.',
      'INVALID_SPEC'
    )
  }
  validateInputs(rollDef, input, specName)
  const mergedInput = applyInputDefaults(input, rollDef.inputs)
  const override = evaluateNormalizedWhen(rollDef.when, mergedInput)

  const effectiveDice = override?.dice ?? rollDef.dice
  const effectiveModify = override?.modify ?? rollDef.modify ?? []
  const effectiveResolve = override?.resolve ?? rollDef.resolve
  const effectiveOutcome = override?.outcome ?? rollDef.outcome
  const effectivePostResolveModifiers =
    override?.postResolveModifiers ?? rollDef.postResolveModifiers

  const { rollerOptions, manualOps } = translateModifiers(effectiveModify, mergedInput)

  if (rollDef.dicePools !== undefined) {
    const poolEntries = Object.entries(rollDef.dicePools)
    const poolResults = Object.fromEntries(
      poolEntries.map(([key, diceConfig]) => [key, rollSinglePool(diceConfig, mergedInput)])
    )
    const allRolls: RollRecord[] = Object.values(poolResults).flatMap(p => [...p.rolls])
    const basePoolTotal = Object.values(poolResults).reduce((s, p) => s + p.total, 0)

    // Apply conditional pools (track totals by name for $conditionalPool details refs)
    const conditionalPoolTotals: Record<string, number> = {}
    if (rollDef.conditionalPools !== undefined) {
      for (const [name, cp] of Object.entries(rollDef.conditionalPools)) {
        const inputVal = mergedInput[cp.condition.input]
        if (inputVal === undefined) {
          conditionalPoolTotals[name] = 0
          continue
        }
        if (evaluateCondition(cp.condition, mergedInput)) {
          const cpSides = bindInteger(cp.pool.sides, mergedInput)
          const cpQty =
            cp.pool.quantity !== undefined ? bindInteger(cp.pool.quantity, mergedInput) : 1
          const cpResult = roll({ sides: cpSides, quantity: cpQty })
          const cpTotal = cpResult.rolls
            .flatMap((r: RollRecord) => r.rolls)
            .reduce((s, v) => s + v, 0)
          conditionalPoolTotals[name] = cpTotal
          allRolls.push(...cpResult.rolls)
        } else {
          conditionalPoolTotals[name] = 0
        }
      }
    }

    const cpAdjustment = Object.entries(rollDef.conditionalPools ?? {}).reduce(
      (acc, [name, cp]) => {
        const cpTotal = conditionalPoolTotals[name] ?? 0
        return acc + (cp.arithmetic === 'add' ? cpTotal : -cpTotal)
      },
      0
    )
    const diceTotal = basePoolTotal + cpAdjustment
    const total = applyPostResolveModifiers(diceTotal, effectivePostResolveModifiers, mergedInput)
    const result = resolveCompareResult(override?.resolve ?? rollDef.resolve, poolResults)
    if (rollDef.details !== undefined && Object.keys(rollDef.details).length > 0) {
      const poolTotals = Object.fromEntries(
        Object.entries(poolResults).map(([k, v]) => [k, v.total])
      )
      const details = buildDetails(rollDef.details, {
        input: mergedInput,
        diceTotal,
        total,
        poolTotals,
        conditionalPoolTotals,
        rolls: allRolls
      })
      return { total, result, rolls: allRolls, details }
    }
    return { total, result, rolls: allRolls }
  }

  if (effectiveDice === undefined) {
    throw new SchemaError(
      'executePipeline: dice is required when dicePools is absent',
      'INVALID_SPEC'
    )
  }
  const optionsArray = buildRollOptionsArray(effectiveDice, mergedInput, rollerOptions)

  const rollerResult = roll(...optionsArray)
  const preModifyRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.initialRolls)
  const rawRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.rolls)
  const workingRolls = applyManualModifiers(rawRolls, manualOps)
  const rawTotal = resolveTotal(workingRolls, effectiveResolve, mergedInput)
  const total = applyPostResolveModifiers(rawTotal, effectivePostResolveModifiers, mergedInput)
  const result = applyOutcome(total, effectiveOutcome, preModifyRolls, workingRolls, mergedInput)

  if (rollDef.details !== undefined && Object.keys(rollDef.details).length > 0) {
    const details = buildDetails(rollDef.details, {
      input: mergedInput,
      diceTotal: rawTotal,
      total,
      poolTotals: {},
      conditionalPoolTotals: {},
      rolls: rollerResult.rolls
    })
    return { total, result, rolls: rollerResult.rolls, details }
  }
  return { total, result, rolls: rollerResult.rolls }
}
