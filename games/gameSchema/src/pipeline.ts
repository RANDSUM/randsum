import { roll } from '@randsum/roller'
import type { RollOptions, RollRecord } from '@randsum/roller'

import { evaluateWhen } from './conditionEvaluator'
import { SchemaError } from './errors'
import { bindInteger } from './inputBinder'
import { type ManualOp, translateModifiers } from './modifierTranslator'
import { isRef, resolveRef } from './refResolver'
import type {
  DegreeOfSuccessOperation,
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
  pool: DiceConfig['pool'],
  _input: RollInput,
  spec: RandSumSpec
): PoolDefinition {
  if (isRef(pool)) {
    const resolved = resolveRef(spec, pool.$ref)
    return resolved as PoolDefinition
  }
  return pool
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
  workingRolls: readonly number[]
): boolean {
  const pool = condition.pool === 'postModify' ? workingRolls : preModifyRolls
  const matchCount = pool.filter(v =>
    compareNum(v, condition.countWhere.operator, bindInteger(condition.countWhere.value, {}))
  ).length
  if (condition.atLeast !== undefined) {
    return matchCount >= bindInteger(condition.atLeast, {})
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
  workingRolls: readonly number[]
): string {
  for (const range of ranges) {
    const poolMatch =
      range.poolCondition === undefined ||
      evaluatePoolCondition(range.poolCondition, preModifyRolls, workingRolls)
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

  return String(total)
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

function applyOutcome(
  total: number,
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[]
): string | number {
  if (outcome === undefined) return total

  const resolved: OutcomeOperation = isRef(outcome)
    ? (resolveRef(spec, outcome.$ref) as OutcomeOperation)
    : outcome

  if ('ranges' in resolved) {
    return lookupRanges(total, resolved.ranges, preModifyRolls, workingRolls)
  }
  if ('degreeOfSuccess' in resolved) {
    return applyDegreeOfSuccess(total, resolved.degreeOfSuccess)
  }
  if ('tableLookup' in resolved) {
    const table = resolveTableDefinition(resolved.tableLookup, spec)
    return lookupRanges(total, table.ranges, preModifyRolls, workingRolls)
  }

  return String(total)
}

export function executePipeline(
  rollDef: RollDefinition,
  input: RollInput,
  spec: RandSumSpec
): GameRollResult<string | number, undefined, RollRecord> {
  const mergedInput = applyInputDefaults(input, rollDef.inputs)
  const override = evaluateWhen(rollDef.when, mergedInput)

  const effectiveDice = override?.dice ?? rollDef.dice
  const effectiveModify = override?.modify ?? rollDef.modify ?? []
  const effectiveResolve = override?.resolve ?? rollDef.resolve
  const effectiveOutcome = override?.outcome ?? rollDef.outcome
  const effectivePostResolveModifiers =
    override?.postResolveModifiers ?? rollDef.postResolveModifiers

  const { rollerOptions, manualOps } = translateModifiers(effectiveModify, mergedInput)
  if (effectiveDice === undefined) {
    throw new Error('executePipeline: dice is required (dicePools path not yet implemented)')
  }
  const optionsArray = buildRollOptionsArray(effectiveDice, mergedInput, spec, rollerOptions)

  const rollerResult = roll(...optionsArray)
  const preModifyRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.initialRolls)
  const rawRolls = rollerResult.rolls.flatMap((r: RollRecord) => r.rolls)
  const workingRolls = applyManualModifiers(rawRolls, manualOps)
  const rawTotal = resolveTotal(workingRolls, effectiveResolve, mergedInput)
  const total = applyPostResolveModifiers(rawTotal, effectivePostResolveModifiers, mergedInput)
  const result = applyOutcome(total, effectiveOutcome, spec, preModifyRolls, workingRolls)

  return { total, result, rolls: rollerResult.rolls }
}
