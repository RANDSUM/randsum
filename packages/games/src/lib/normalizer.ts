import type {
  NormalizedConditionalPool,
  NormalizedDetailsFieldDef,
  NormalizedDetailsLeafDef,
  NormalizedDiceConfig,
  NormalizedOutcome,
  NormalizedPipelineOverride,
  NormalizedPoolDefinition,
  NormalizedResolveOperation,
  NormalizedRollCase,
  NormalizedRollDefinition,
  NormalizedSpec
} from './normalizedTypes'
import { isRef, resolveOutcomeRef, resolvePoolRef, resolveTableRef } from './refResolver'
import { getRollDefinitions, isConditionalDetails, isDetailsLeaf } from './typeGuards'
import type {
  ConditionalPool,
  DetailsFieldDef,
  DiceConfig,
  OutcomeOperation,
  PipelineOverride,
  PoolDefinition,
  RandSumSpec,
  Ref,
  ResolveOperation,
  RollCase,
  RollDefinition,
  TableDefinition
} from './types'

function normalizePool(pool: PoolDefinition | Ref, spec: RandSumSpec): NormalizedPoolDefinition {
  if (isRef(pool)) {
    const resolved = resolvePoolRef(spec, pool.$ref)
    return {
      sides: resolved.sides,
      ...(resolved.quantity !== undefined ? { quantity: resolved.quantity } : {})
    }
  }
  return { sides: pool.sides, ...(pool.quantity !== undefined ? { quantity: pool.quantity } : {}) }
}

function normalizeDiceConfig(dc: DiceConfig, spec: RandSumSpec): NormalizedDiceConfig {
  const pool = normalizePool(dc.pool, spec)
  return {
    pool,
    ...(dc.quantity !== undefined ? { quantity: dc.quantity } : {}),
    ...(dc.key !== undefined ? { key: dc.key } : {})
  }
}

function normalizeDice(
  dice: DiceConfig | readonly DiceConfig[],
  spec: RandSumSpec
): NormalizedDiceConfig | readonly NormalizedDiceConfig[] {
  if (Array.isArray(dice)) {
    return dice.map((dc: DiceConfig) => normalizeDiceConfig(dc, spec))
  }
  return normalizeDiceConfig(dice as DiceConfig, spec)
}

function normalizeTableDefinition(
  tableOrRef: { readonly $ref: string } | TableDefinition,
  spec: RandSumSpec
): TableDefinition {
  if (isRef(tableOrRef)) {
    return resolveTableRef(spec, tableOrRef.$ref)
  }
  return tableOrRef
}

function normalizeResolveOperation(
  resolve: ResolveOperation,
  spec: RandSumSpec
): NormalizedResolveOperation {
  if (resolve === 'sum') return 'sum'
  if ('countMatching' in resolve) return { countMatching: resolve.countMatching }
  if ('tableLookup' in resolve) {
    return { tableLookup: normalizeTableDefinition(resolve.tableLookup, spec) }
  }
  if ('comparePoolHighest' in resolve) return { comparePoolHighest: resolve.comparePoolHighest }
  if ('comparePoolSum' in resolve) return { comparePoolSum: resolve.comparePoolSum }
  return { remoteTableLookup: resolve.remoteTableLookup }
}

function normalizeOutcome(outcome: OutcomeOperation | Ref, spec: RandSumSpec): NormalizedOutcome {
  const resolved: OutcomeOperation = isRef(outcome)
    ? resolveOutcomeRef(spec, outcome.$ref)
    : outcome

  if ('ranges' in resolved) {
    return { ranges: resolved.ranges }
  }
  if ('degreeOfSuccess' in resolved) {
    return { degreeOfSuccess: resolved.degreeOfSuccess }
  }
  // tableLookup
  if ('tableLookup' in resolved) {
    return { tableLookup: normalizeTableDefinition(resolved.tableLookup, spec) }
  }
  // Should be unreachable given OutcomeOperation's type
  return resolved as NormalizedOutcome
}

function normalizeDetailsLeaf(leaf: DetailsFieldDef): NormalizedDetailsLeafDef {
  // This is called only when we know it's a leaf
  return leaf as NormalizedDetailsLeafDef
}

function normalizeDetailsField(def: DetailsFieldDef): NormalizedDetailsFieldDef {
  if (isDetailsLeaf(def)) {
    return { kind: 'leaf', def: normalizeDetailsLeaf(def) }
  }
  if (isConditionalDetails(def)) {
    return {
      kind: 'conditional',
      when: def.when,
      fields: Object.fromEntries(
        Object.entries(def.value).map(([k, v]) => [k, normalizeDetailsLeaf(v)])
      )
    }
  }
  // Nested object: Record<string, DetailsLeafDef>
  const nested = def as Readonly<Record<string, DetailsFieldDef>>
  return {
    kind: 'nested',
    fields: Object.fromEntries(Object.entries(nested).map(([k, v]) => [k, normalizeDetailsLeaf(v)]))
  }
}

function normalizeDetails(
  details: Readonly<Record<string, DetailsFieldDef>>
): Readonly<Record<string, NormalizedDetailsFieldDef>> {
  return Object.fromEntries(Object.entries(details).map(([k, v]) => [k, normalizeDetailsField(v)]))
}

function normalizeConditionalPool(
  cp: ConditionalPool,
  spec: RandSumSpec
): NormalizedConditionalPool {
  const pool = normalizePool(cp.pool, spec)
  return {
    condition: cp.condition,
    pool,
    arithmetic: cp.arithmetic
  }
}

function normalizePipelineOverride(
  override: PipelineOverride,
  spec: RandSumSpec
): NormalizedPipelineOverride {
  return {
    ...(override.dice !== undefined ? { dice: normalizeDice(override.dice, spec) } : {}),
    ...(override.modify !== undefined ? { modify: override.modify } : {}),
    ...(override.resolve !== undefined
      ? { resolve: normalizeResolveOperation(override.resolve, spec) }
      : {}),
    ...(override.outcome !== undefined
      ? { outcome: normalizeOutcome(override.outcome, spec) }
      : {}),
    ...(override.postResolveModifiers !== undefined
      ? { postResolveModifiers: override.postResolveModifiers }
      : {})
  }
}

function normalizeRollCase(rollCase: RollCase, spec: RandSumSpec): NormalizedRollCase {
  return {
    condition: rollCase.condition,
    override: normalizePipelineOverride(rollCase.override, spec)
  }
}

function normalizeRollDefinition(
  rollDef: RollDefinition,
  spec: RandSumSpec
): NormalizedRollDefinition {
  return {
    ...(rollDef.inputs !== undefined ? { inputs: rollDef.inputs } : {}),
    ...(rollDef.dice !== undefined ? { dice: normalizeDice(rollDef.dice, spec) } : {}),
    ...(rollDef.dicePools !== undefined
      ? {
          dicePools: Object.fromEntries(
            Object.entries(rollDef.dicePools).map(([k, dc]) => [k, normalizeDiceConfig(dc, spec)])
          )
        }
      : {}),
    ...(rollDef.conditionalPools !== undefined
      ? {
          conditionalPools: Object.fromEntries(
            Object.entries(rollDef.conditionalPools).map(([k, cp]) => [
              k,
              normalizeConditionalPool(cp, spec)
            ])
          )
        }
      : {}),
    ...(rollDef.modify !== undefined ? { modify: rollDef.modify } : {}),
    ...(rollDef.postResolveModifiers !== undefined
      ? { postResolveModifiers: rollDef.postResolveModifiers }
      : {}),
    resolve: normalizeResolveOperation(rollDef.resolve, spec),
    ...(rollDef.outcome !== undefined ? { outcome: normalizeOutcome(rollDef.outcome, spec) } : {}),
    ...(rollDef.when !== undefined
      ? { when: rollDef.when.map(rc => normalizeRollCase(rc, spec)) }
      : {}),
    ...(rollDef.details !== undefined ? { details: normalizeDetails(rollDef.details) } : {})
  }
}

export function normalizeSpec(spec: RandSumSpec): NormalizedSpec {
  const rollDefs = getRollDefinitions(spec)
  const rolls = Object.fromEntries(
    Object.entries(rollDefs).map(([key, rollDef]) => [key, normalizeRollDefinition(rollDef, spec)])
  )

  return {
    name: spec.name,
    shortcode: spec.shortcode,
    ...(spec.version !== undefined ? { version: spec.version } : {}),
    game_url: spec.game_url,
    ...(spec.srd_url !== undefined ? { srd_url: spec.srd_url } : {}),
    rolls
  }
}
