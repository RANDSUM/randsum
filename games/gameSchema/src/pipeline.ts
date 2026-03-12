import { roll, validateFinite, validateRange } from '@randsum/roller'
import type { RollOptions, RollRecord } from '@randsum/roller'

import { evaluateWhen } from './conditionEvaluator'
import { SchemaError } from './errors'
import { bindInteger } from './inputBinder'
import { type ManualOp, translateModifiers } from './modifierTranslator'
import { isRef, resolveRef } from './refResolver'
import type {
  ComparePoolOperation,
  Condition,
  DegreeOfSuccessOperation,
  DetailsFieldDef,
  DetailsLeafDef,
  DiceConfig,
  GameRollResult,
  InputDeclaration,
  InputValue,
  OutcomeOperation,
  PoolCondition,
  PoolDefinition,
  PostResolveModifyOperation,
  RandSumSpec,
  Ref,
  RefOrTableDefinition,
  ResolveOperation,
  RollDefinition,
  RollInput,
  TableDefinition,
  TableRange
} from './types'

function compareNum(a: number, op: string, b: number): boolean {
  switch (op) {
    case '>':
      return a > b
    case '>=':
      return a >= b
    case '<':
      return a < b
    case '<=':
      return a <= b
    case '=':
      return a === b
    default:
      return false
  }
}

function applyInputDefaults(
  input: RollInput,
  inputs: Readonly<Record<string, InputDeclaration>> | undefined
): RollInput {
  if (!inputs) return input
  return Object.entries(inputs).reduce<Readonly<Record<string, InputValue>>>((acc, [key, decl]) => {
    if (acc[key] !== undefined || decl.default === undefined) return acc
    return { ...acc, [key]: decl.default }
  }, input)
}

function resolveDicePool(
  pool: DiceConfig['pool'] | PoolDefinition | Ref,
  _input: RollInput,
  spec: RandSumSpec
): PoolDefinition {
  if (isRef(pool)) {
    const resolved = resolveRef(spec, pool.$ref)
    return resolved as PoolDefinition
  }
  return pool
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
  diceConfig: DiceConfig,
  mergedInput: RollInput,
  spec: RandSumSpec,
  rollerOptions: ReturnType<typeof translateModifiers>['rollerOptions']
): RollOptions {
  const pool = resolveDicePool(diceConfig.pool, mergedInput, spec)
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
  dice: DiceConfig | readonly DiceConfig[],
  mergedInput: RollInput,
  spec: RandSumSpec,
  rollerOptions: ReturnType<typeof translateModifiers>['rollerOptions']
): RollOptions[] {
  if (Array.isArray(dice)) {
    return (dice as readonly DiceConfig[]).map(dc =>
      buildSingleRollOptions(dc, mergedInput, spec, rollerOptions)
    )
  }
  return [buildSingleRollOptions(dice as DiceConfig, mergedInput, spec, rollerOptions)]
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
              flags: compareNum(die.value, op.operator, op.value)
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

function resolveTableDefinition(
  tableOrRef: RefOrTableDefinition,
  spec: RandSumSpec
): TableDefinition {
  if (isRef(tableOrRef)) {
    const resolved = resolveRef(spec, tableOrRef.$ref)
    return resolved as TableDefinition
  }
  return tableOrRef
}

function evaluatePoolCondition(
  condition: PoolCondition,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): boolean {
  const pool = condition.pool === 'postModify' ? workingRolls : preModifyRolls
  const matchCount = pool.filter(v =>
    compareNum(v, condition.countWhere.operator, bindInteger(condition.countWhere.value, input))
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
    const valueMatch =
      (range.exact !== undefined && total === range.exact) ||
      (range.min !== undefined &&
        range.max !== undefined &&
        total >= range.min &&
        total <= range.max) ||
      (range.poolCondition !== undefined && range.exact === undefined && range.min === undefined)
    if (poolMatch && valueMatch) return range.result
  }
  throw new SchemaError('NO_TABLE_MATCH', `No table entry matches total ${total}`)
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

  throw new SchemaError('NO_TABLE_MATCH', `No degree of success matches total ${total}`)
}

function resolveTotal(
  rolls: readonly number[],
  resolve: ResolveOperation,
  input: RollInput
): number {
  if (resolve === 'sum') {
    return rolls.reduce((sum, v) => sum + v, 0)
  }
  if (typeof resolve === 'object' && 'countMatching' in resolve) {
    const { operator, value } = resolve.countMatching
    const threshold = bindInteger(value, input)
    return rolls.filter(v => compareNum(v, operator, threshold)).length
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
  diceConfig: DiceConfig,
  mergedInput: RollInput,
  spec: RandSumSpec
): { readonly total: number; readonly rolls: readonly RollRecord[] } {
  const opts = buildSingleRollOptions(diceConfig, mergedInput, spec, {})
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
  resolve: ResolveOperation,
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
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): string | number {
  if (outcome === undefined) return total

  const resolved: OutcomeOperation = isRef(outcome)
    ? (resolveRef(spec, outcome.$ref) as OutcomeOperation)
    : outcome

  if ('ranges' in resolved) {
    return lookupRanges(total, resolved.ranges, preModifyRolls, workingRolls, input)
  }
  if ('degreeOfSuccess' in resolved) {
    return applyDegreeOfSuccess(total, resolved.degreeOfSuccess)
  }
  if ('tableLookup' in resolved) {
    const table = resolveTableDefinition(resolved.tableLookup, spec)
    return lookupRanges(total, table.ranges, preModifyRolls, workingRolls, input)
  }

  return String(total)
}

function validateInputs(rollDef: RollDefinition, input: RollInput, specName: string): void {
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
      throw new Error(`Invalid ${fieldName} value: ${String(val)}. Must be ${enumList}.`)
    }
  }
}

interface DetailsContext {
  readonly input: RollInput
  readonly diceTotal: number
  readonly total: number
  readonly poolTotals: Readonly<Record<string, number>>
  readonly conditionalPoolTotals: readonly number[]
}

function isDetailsLeaf(def: DetailsFieldDef): def is DetailsLeafDef {
  return '$input' in def || 'expr' in def || '$pool' in def || '$conditionalPool' in def
}

function isConditionalDetails(def: DetailsFieldDef): def is {
  readonly when: { readonly input: string }
  readonly value: Readonly<Record<string, DetailsLeafDef>>
} {
  return 'when' in def && 'value' in def
}

function resolveLeaf(leaf: DetailsLeafDef, ctx: DetailsContext): InputValue | number | undefined {
  if ('expr' in leaf) return leaf.expr === 'diceTotal' ? ctx.diceTotal : ctx.total
  if ('$pool' in leaf) return ctx.poolTotals[leaf.$pool] ?? 0
  if ('$conditionalPool' in leaf) return ctx.conditionalPoolTotals[leaf.$conditionalPool] ?? 0
  const val = ctx.input[leaf.$input]
  if (val !== undefined) return val
  if (leaf.default !== undefined) return leaf.default
  return undefined
}

function buildDetails(
  detailsDef: Readonly<Record<string, DetailsFieldDef>>,
  ctx: DetailsContext
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  for (const [fieldName, def] of Object.entries(detailsDef)) {
    if (isDetailsLeaf(def)) {
      result[fieldName] = resolveLeaf(def, ctx)
    } else if (isConditionalDetails(def)) {
      const condVal = ctx.input[def.when.input]
      if (condVal === undefined) {
        result[fieldName] = undefined
      } else {
        const nested: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(def.value)) {
          nested[k] = resolveLeaf(v, ctx)
        }
        result[fieldName] = nested
      }
    } else {
      // Nested object
      const nested: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(def)) {
        if (isDetailsLeaf(v)) {
          nested[k] = resolveLeaf(v, ctx)
        }
      }
      result[fieldName] = nested
    }
  }
  return result
}

export function executePipeline(
  rollDef: RollDefinition,
  input: RollInput,
  spec: RandSumSpec
): GameRollResult<string | number, Readonly<Record<string, unknown>> | undefined, RollRecord> {
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    throw new SchemaError(
      'INVALID_SPEC',
      'Spec uses remoteTableLookup which requires async execution. Use loadSpecAsync() instead.'
    )
  }
  validateInputs(rollDef, input, spec.name)
  const mergedInput = applyInputDefaults(input, rollDef.inputs)
  const override = evaluateWhen(rollDef.when, mergedInput)

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
      poolEntries.map(([key, diceConfig]) => [key, rollSinglePool(diceConfig, mergedInput, spec)])
    )
    const allRolls: RollRecord[] = Object.values(poolResults).flatMap(p => [...p.rolls])
    const basePoolTotal = Object.values(poolResults).reduce((s, p) => s + p.total, 0)

    // Apply conditional pools (track totals by index for $conditionalPool details refs)
    const conditionalPoolTotals: number[] = []
    if (rollDef.conditionalPools !== undefined) {
      for (const cp of rollDef.conditionalPools) {
        const inputVal = mergedInput[cp.condition.input]
        if (inputVal === undefined) {
          conditionalPoolTotals.push(0)
          continue
        }
        if (evaluateCondition(cp.condition, mergedInput)) {
          const cpPool = resolveDicePool(cp.pool, mergedInput, spec)
          const cpSides = bindInteger(cpPool.sides, mergedInput)
          const cpQty =
            cpPool.quantity !== undefined ? bindInteger(cpPool.quantity, mergedInput) : 1
          const cpResult = roll({ sides: cpSides, quantity: cpQty })
          const cpTotal = cpResult.rolls
            .flatMap((r: RollRecord) => r.rolls)
            .reduce((s, v) => s + v, 0)
          conditionalPoolTotals.push(cpTotal)
          allRolls.push(...cpResult.rolls)
        } else {
          conditionalPoolTotals.push(0)
        }
      }
    }

    const cpAdjustment = (rollDef.conditionalPools ?? []).reduce((acc, cp, idx) => {
      const cpTotal = conditionalPoolTotals[idx] ?? 0
      return acc + (cp.arithmetic === 'add' ? cpTotal : -cpTotal)
    }, 0)
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
        conditionalPoolTotals
      })
      return { total, result, rolls: allRolls, details }
    }
    return { total, result, rolls: allRolls }
  }

  if (effectiveDice === undefined) {
    throw new SchemaError(
      'INVALID_SPEC',
      'executePipeline: dice is required when dicePools is absent'
    )
  }
  const optionsArray = buildRollOptionsArray(effectiveDice, mergedInput, spec, rollerOptions)

  const rollerResult = roll(...optionsArray)
  const preModifyRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.initialRolls)
  const rawRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.rolls)
  const workingRolls = applyManualModifiers(rawRolls, manualOps)
  const rawTotal = resolveTotal(workingRolls, effectiveResolve, mergedInput)
  const total = applyPostResolveModifiers(rawTotal, effectivePostResolveModifiers, mergedInput)
  const result = applyOutcome(
    total,
    effectiveOutcome,
    spec,
    preModifyRolls,
    workingRolls,
    mergedInput
  )

  if (rollDef.details !== undefined && Object.keys(rollDef.details).length > 0) {
    const details = buildDetails(rollDef.details, {
      input: mergedInput,
      diceTotal: rawTotal,
      total,
      poolTotals: {},
      conditionalPoolTotals: []
    })
    return { total, result, rolls: rollerResult.rolls, details }
  }
  return { total, result, rolls: rollerResult.rolls }
}
