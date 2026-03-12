import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { SchemaError } from './errors'
import { isRef, resolveRef } from './refResolver'
import type {
  Condition,
  DegreeOfSuccessOperation,
  DetailsFieldDef,
  DetailsLeafDef,
  DiceConfig,
  ExternalTableLookupOperation,
  InputDeclaration,
  IntegerOrInput,
  ModifyOperation,
  OutcomeOperation,
  PoolDefinition,
  PostResolveModifyOperation,
  RandSumSpec,
  Ref,
  ResultMappingLeaf,
  RollCase,
  RollDefinition,
  TableRange
} from './types'
import { validateSpec } from './validator'

function isRollDefinition(value: unknown): value is RollDefinition {
  if (typeof value !== 'object' || value === null) return false
  if (!('resolve' in value)) return false
  return 'dice' in value || 'dicePools' in value
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function specToFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function toDiceConfig(dice: DiceConfig | readonly DiceConfig[]): DiceConfig {
  if ('pool' in dice) return dice
  const [first] = dice
  if (first === undefined) throw new SchemaError('INVALID_SPEC', 'dice array is empty')
  return first
}

function resolvePool(pool: PoolDefinition | { $ref: string }, spec: RandSumSpec): PoolDefinition {
  if (isRef(pool)) {
    return resolveRef(spec, pool.$ref) as PoolDefinition
  }
  return pool
}

function inputAllOptional(inputs: RollDefinition['inputs']): boolean {
  if (!inputs || Object.keys(inputs).length === 0) return true
  return Object.values(inputs).every(isInputOptional)
}

function integerOrInputCode(
  val: IntegerOrInput,
  inputs: RollDefinition['inputs'],
  optional: boolean
): string {
  if (typeof val === 'number') return String(val)
  if ('ifTrue' in val && 'ifFalse' in val) {
    const accessor = optional ? `input?.${val.$input}` : `input.${val.$input}`
    return `(${accessor} ? ${val.ifTrue} : ${val.ifFalse})`
  }
  const fieldName = val.$input
  const decl = inputs?.[fieldName]
  const accessor = optional ? `input?.${fieldName}` : `input.${fieldName}`
  if (decl?.default !== undefined) {
    return `(${accessor} ?? ${String(decl.default)})`
  }
  return accessor
}

function inputTsType(decl: InputDeclaration): string {
  if (decl.type === 'integer') return 'number'
  if (decl.type === 'boolean') return 'boolean'
  if (decl.enum !== undefined && decl.enum.length > 0) {
    return decl.enum.map(v => `'${v}'`).join(' | ')
  }
  return 'string'
}

function isInputOptional(decl: InputDeclaration): boolean {
  return decl.default !== undefined || decl.optional === true
}

function buildInputType(inputs: RollDefinition['inputs']): string {
  if (!inputs || Object.keys(inputs).length === 0) return 'Record<string, never>'
  const fields = Object.entries(inputs).map(([name, decl]: [string, InputDeclaration]) => {
    const tsType = inputTsType(decl)
    const opt = isInputOptional(decl) ? '?' : ''
    return `${name}${opt}: ${tsType}`
  })
  return `{ ${fields.join('; ')} }`
}

function buildModifiersCode(
  modify: readonly ModifyOperation[],
  inputs: RollDefinition['inputs'],
  optional: boolean
): string | null {
  const mods: string[] = []
  for (const op of modify) {
    if (op.keepHighest !== undefined) {
      mods.push(`keep: { highest: ${integerOrInputCode(op.keepHighest, inputs, optional)} }`)
    }
    if (op.keepLowest !== undefined) {
      mods.push(`keep: { lowest: ${integerOrInputCode(op.keepLowest, inputs, optional)} }`)
    }
    if (op.cap !== undefined) {
      const capParts: string[] = []
      if (op.cap.min !== undefined)
        capParts.push(`lessThan: ${integerOrInputCode(op.cap.min, inputs, optional)}`)
      if (op.cap.max !== undefined)
        capParts.push(`greaterThan: ${integerOrInputCode(op.cap.max, inputs, optional)}`)
      mods.push(`cap: { ${capParts.join(', ')} }`)
    }
  }
  // Accumulate all add ops into a single plus to avoid duplicate keys
  const addOps = modify.filter(
    (op): op is ModifyOperation & { readonly add: IntegerOrInput } => op.add !== undefined
  )
  if (addOps.length === 1) {
    mods.push(`plus: ${integerOrInputCode(addOps[0].add, inputs, optional)}`)
  } else if (addOps.length > 1) {
    const sum = addOps.map(op => integerOrInputCode(op.add, inputs, optional)).join(' + ')
    mods.push(`plus: ${sum}`)
  }
  if (mods.length === 0) return null
  return `modifiers: { ${mods.join(', ')} }`
}

function buildDiceOptionsCode(
  dice: DiceConfig | readonly DiceConfig[],
  modify: readonly ModifyOperation[] | undefined,
  spec: RandSumSpec,
  inputs: Readonly<Record<string, InputDeclaration>> | undefined,
  optional: boolean
): string {
  const dc = toDiceConfig(dice)
  const pool = resolvePool(dc.pool, spec)
  const sides =
    typeof pool.sides === 'number'
      ? String(pool.sides)
      : integerOrInputCode(pool.sides, inputs, optional)
  const quantitySource = dc.quantity ?? pool.quantity
  const qty =
    quantitySource !== undefined ? integerOrInputCode(quantitySource, inputs, optional) : '1'
  const modsStr = modify && modify.length > 0 ? buildModifiersCode(modify, inputs, optional) : null
  const fields = [`sides: ${sides}`, `quantity: ${qty}`]
  if (modsStr) fields.push(modsStr)
  return `{ ${fields.join(', ')} }`
}

function conditionCodeFromCondition(condition: Condition, optional: boolean): string {
  const tsOp = condition.operator === '=' ? '===' : condition.operator
  const val = typeof condition.value === 'string' ? `'${condition.value}'` : String(condition.value)
  const accessor = optional ? `input?.${condition.input}` : `input.${condition.input}`
  return `${accessor} ${tsOp} ${val}`
}

function conditionCode(rollCase: RollCase, optional: boolean): string {
  return conditionCodeFromCondition(rollCase.condition, optional)
}

function getOutcomeRanges(
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec
): readonly TableRange[] {
  if (!outcome) return []
  if (isRef(outcome)) {
    return getOutcomeRanges(resolveRef(spec, outcome.$ref) as OutcomeOperation, spec)
  }
  if ('ranges' in outcome) return outcome.ranges
  if ('tableLookup' in outcome) {
    const resolved = isRef(outcome.tableLookup)
      ? (resolveRef(spec, outcome.tableLookup.$ref) as { ranges: readonly TableRange[] })
      : outcome.tableLookup
    return resolved.ranges
  }
  return []
}

function resolveOutcome(
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec
): OutcomeOperation | undefined {
  if (outcome === undefined) return undefined
  if (isRef(outcome)) return resolveRef(spec, outcome.$ref) as OutcomeOperation
  return outcome
}

function getResultStrings(
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec
): string[] {
  const resolved = resolveOutcome(outcome, spec)
  if (resolved === undefined) return []
  if ('degreeOfSuccess' in resolved) {
    return Object.keys(resolved.degreeOfSuccess)
  }
  return getOutcomeRanges(outcome, spec).map(r => r.result)
}

function generateDegreeLines(
  degrees: DegreeOfSuccessOperation,
  indent: string,
  rollsExpr: string,
  hasDetails: boolean
): string[] {
  const candidates: [string, number][] = []
  if (degrees.criticalSuccess !== undefined)
    candidates.push(['criticalSuccess', degrees.criticalSuccess])
  if (degrees.success !== undefined) candidates.push(['success', degrees.success])
  if (degrees.failure !== undefined) candidates.push(['failure', degrees.failure])
  if (degrees.criticalFailure !== undefined)
    candidates.push(['criticalFailure', degrees.criticalFailure])
  candidates.sort((a, b) => b[1] - a[1])

  const detailsPart = hasDetails ? ', details' : ''
  const ifLines = candidates
    .slice(0, -1)
    .map(
      ([name, threshold]) =>
        `${indent}if (total >= ${threshold}) return { total, result: '${name}', rolls: ${rollsExpr}${detailsPart} }`
    )
  const last = candidates[candidates.length - 1]
  const defaultLine =
    last !== undefined
      ? `${indent}return { total, result: '${last[0]}', rolls: ${rollsExpr}${detailsPart} }`
      : `${indent}throw new Error(\`No degree match for total \${total}\`)`
  return [...ifLines, defaultLine]
}

// Returns string[] for known unions, null for numeric passthrough, 'string' for opaque string, 'object' for resultMapping
function collectResults(
  rollDef: RollDefinition,
  spec: RandSumSpec
): string[] | null | 'string' | 'object' {
  // externalTableLookup: result type depends on resultMapping presence
  if (typeof rollDef.resolve === 'object' && 'externalTableLookup' in rollDef.resolve) {
    return rollDef.resolve.externalTableLookup.resultMapping !== undefined ? 'object' : 'string'
  }
  // dicePools: collect results from compare operation outcomes + ties
  if (rollDef.dicePools !== undefined) {
    const resolve = rollDef.resolve
    if (
      typeof resolve === 'object' &&
      ('comparePoolHighest' in resolve || 'comparePoolSum' in resolve)
    ) {
      const op =
        'comparePoolHighest' in resolve ? resolve.comparePoolHighest : resolve.comparePoolSum
      const [keyA, keyB] = op.pools
      // When ties is omitted the runtime emits 'keyA=keyB' — include it in the type
      const tieResult = op.ties ?? `${keyA}=${keyB}`
      return [...new Set([...Object.values(op.outcomes), tieResult])].sort()
    }
    return null
  }
  // null signals "no outcome" — numeric passthrough
  if (rollDef.outcome === undefined) return null
  const defaultResults = getResultStrings(rollDef.outcome, spec)
  const whenResults = (rollDef.when ?? []).flatMap(wc =>
    wc.override.outcome ? getResultStrings(wc.override.outcome, spec) : []
  )
  return [...new Set([...defaultResults, ...whenResults])].sort()
}

function buildRangeReturn(
  range: TableRange,
  indent: string,
  inputs: RollDefinition['inputs'],
  optional: boolean,
  hasDetails: boolean
): string | null {
  const conditions: string[] = []
  const detailsPart = hasDetails ? ', details' : ''
  const ret = `{ total, result: '${range.result}', rolls: r.rolls${detailsPart} }`

  if (range.poolCondition !== undefined) {
    const pc = range.poolCondition
    const poolVar = pc.pool === 'postModify' ? 'postModify' : 'preModify'
    const opMap: Record<string, string> = {
      '=': '===',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<='
    }
    const op = opMap[pc.countWhere.operator] ?? '==='
    const val = integerOrInputCode(pc.countWhere.value, inputs, optional)
    const matchExpr = `${poolVar}.filter(v => v ${op} ${val}).length`

    if (pc.atLeast !== undefined) {
      const atLeast = integerOrInputCode(pc.atLeast, inputs, optional)
      conditions.push(`${matchExpr} >= ${atLeast}`)
    } else if (pc.atLeastRatio !== undefined) {
      conditions.push(
        `${poolVar}.length > 0 && ${matchExpr} / ${poolVar}.length >= ${pc.atLeastRatio}`
      )
    }
  }

  if (range.exact !== undefined) {
    conditions.push(`total === ${range.exact}`)
  } else if (range.min !== undefined && range.max !== undefined) {
    conditions.push(`total >= ${range.min} && total <= ${range.max}`)
  } else if (range.min !== undefined) {
    conditions.push(`total >= ${range.min}`)
  } else if (range.max !== undefined) {
    conditions.push(`total <= ${range.max}`)
  } else if (range.poolCondition === undefined) {
    return `${indent}return ${ret}`
  }

  if (conditions.length > 0) {
    return `${indent}if (${conditions.join(' && ')}) return ${ret}`
  }
  return null
}

function buildPostResolveTotalExpr(
  postResolveModifiers: RollDefinition['postResolveModifiers'],
  inputs: RollDefinition['inputs'],
  optional: boolean
): string {
  if (!postResolveModifiers || postResolveModifiers.length === 0) return 'r.total'
  const adds = postResolveModifiers
    .filter(
      (op): op is PostResolveModifyOperation & { add: IntegerOrInput } => op.add !== undefined
    )
    .map(op => integerOrInputCode(op.add, inputs, optional))
  if (adds.length === 0) return 'r.total'
  return `r.total + ${adds.join(' + ')}`
}

function generateMultiPoolBody(rollDef: RollDefinition, spec: RandSumSpec): string[] {
  const { dicePools, resolve } = rollDef
  if (dicePools === undefined) return []

  const lines: string[] = []
  const poolNames = Object.keys(dicePools)

  const optional = inputAllOptional(rollDef.inputs)

  // Emit one executeRoll per pool
  for (const poolName of poolNames) {
    const dc = dicePools[poolName]
    if (dc === undefined) continue
    const pool = isRef(dc.pool) ? (resolveRef(spec, dc.pool.$ref) as PoolDefinition) : dc.pool
    const sides = integerOrInputCode(pool.sides, rollDef.inputs, optional)
    const quantitySource = dc.quantity ?? pool.quantity
    const qty =
      quantitySource !== undefined
        ? integerOrInputCode(quantitySource, rollDef.inputs, optional)
        : '1'
    lines.push(`  const ${poolName}Result = executeRoll({ sides: ${sides}, quantity: ${qty} })`)
    lines.push(
      `  const ${poolName}Total = ${poolName}Result.rolls.flatMap(r => r.rolls).reduce((s, v) => s + v, 0)`
    )
  }

  lines.push(
    `  const rolls: RollRecord[] = [${poolNames.map(n => `...${n}Result.rolls`).join(', ')}]`
  )
  lines.push(`  let total = ${poolNames.map(n => `${n}Total`).join(' + ')}`)

  // Emit conditional pools (track totals by index for $conditionalPool details refs)
  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const cpIndicesNeeded = hasDetails ? detailsNeedsConditionalPool(detailsDef) : new Set<number>()

  if (rollDef.conditionalPools !== undefined && rollDef.conditionalPools.length > 0) {
    // Pre-declare conditionalPoolNTotal variables for details refs
    for (const idx of cpIndicesNeeded) {
      lines.push(`  let conditionalPool${idx}Total = 0`)
    }
    for (const [idx, cp] of rollDef.conditionalPools.entries()) {
      const cond = conditionCodeFromCondition(cp.condition, optional)
      const cpPool = isRef(cp.pool) ? (resolveRef(spec, cp.pool.$ref) as PoolDefinition) : cp.pool
      const cpSides = integerOrInputCode(cpPool.sides, rollDef.inputs, optional)
      const cpQty =
        cpPool.quantity !== undefined
          ? integerOrInputCode(cpPool.quantity, rollDef.inputs, optional)
          : '1'
      const sign = cp.arithmetic === 'add' ? '+=' : '-='
      lines.push(`  if (${cond}) {`)
      lines.push(`    const cpResult = executeRoll({ sides: ${cpSides}, quantity: ${cpQty} })`)
      lines.push(
        `    const cpTotal = cpResult.rolls.flatMap(r => r.rolls).reduce((s, v) => s + v, 0)`
      )
      if (cpIndicesNeeded.has(idx)) {
        lines.push(`    conditionalPool${idx}Total = cpTotal`)
      }
      lines.push(`    total ${sign} cpTotal`)
      lines.push(`    rolls.push(...cpResult.rolls)`)
      lines.push(`  }`)
    }
  }

  // Capture diceTotal for details (sum of base pools, before conditional/postResolve)
  const needsDiceTotal = hasDetails && detailsNeedsDiceTotal(detailsDef)
  if (needsDiceTotal) {
    lines.push(`  const diceTotal = total`)
  }

  // Emit postResolveModifiers for multi-pool
  if (rollDef.postResolveModifiers !== undefined && rollDef.postResolveModifiers.length > 0) {
    for (const op of rollDef.postResolveModifiers) {
      if (op.add !== undefined) {
        lines.push(`  total += ${integerOrInputCode(op.add, rollDef.inputs, optional)}`)
      }
    }
  }

  // Build details object if declared
  const detailsPart = hasDetails ? ', details' : ''
  if (hasDetails) {
    lines.push(...emitDetailsObjectCode(detailsDef, optional, '  '))
  }

  // Emit comparison logic
  if (
    typeof resolve === 'object' &&
    ('comparePoolHighest' in resolve || 'comparePoolSum' in resolve)
  ) {
    const op = 'comparePoolHighest' in resolve ? resolve.comparePoolHighest : resolve.comparePoolSum
    const [keyA, keyB] = op.pools
    const tiesReturn =
      op.ties !== undefined
        ? `{ total, result: '${op.ties}', rolls${detailsPart} }`
        : `{ total, result: '${keyA}=${keyB}', rolls${detailsPart} }`
    const aWinsReturn = `{ total, result: '${op.outcomes[keyA] ?? keyA}', rolls${detailsPart} }`
    const bWinsReturn = `{ total, result: '${op.outcomes[keyB] ?? keyB}', rolls${detailsPart} }`

    lines.push(`  if (${keyA}Total === ${keyB}Total) return ${tiesReturn}`)
    lines.push(`  if (${keyA}Total > ${keyB}Total) return ${aWinsReturn}`)
    lines.push(`  return ${bWinsReturn}`)
  } else {
    lines.push(`  return { total, result: String(total), rolls${detailsPart} }`)
  }

  return lines
}

function generateOutcomeLines(
  outcome: OutcomeOperation | Ref | undefined,
  spec: RandSumSpec,
  indent: string,
  rollsExpr: string,
  inputs: RollDefinition['inputs'],
  optional: boolean,
  hasDetails = false
): string[] {
  const resolved = resolveOutcome(outcome, spec)
  const detailsPart = hasDetails ? ', details' : ''

  if (resolved === undefined) {
    return [`${indent}return { total, result: total, rolls: ${rollsExpr}${detailsPart} }`]
  }

  if ('degreeOfSuccess' in resolved) {
    return generateDegreeLines(resolved.degreeOfSuccess, indent, rollsExpr, hasDetails)
  }

  const ranges = getOutcomeRanges(outcome, spec)
  const lines: string[] = []
  for (const range of ranges) {
    const check = buildRangeReturn(range, indent, inputs, optional, hasDetails)
    if (check) lines.push(check)
  }
  lines.push(`${indent}throw new Error(\`No table match for total \${total}\`)`)
  return lines
}

function resultMappingLeafExpr(leaf: ResultMappingLeaf, optional: boolean): string {
  if ('$lookupResult' in leaf) {
    const primary = `lookupResult.${leaf.$lookupResult}`
    if (leaf.fallback !== undefined) {
      return `${primary} ?? ${resultMappingLeafExpr(leaf.fallback, optional)}`
    }
    return primary
  }
  if ('$foundTable' in leaf) return `foundTable.${leaf.$foundTable}`
  if ('$input' in leaf) {
    return optional ? `input?.${leaf.$input}` : `input.${leaf.$input}`
  }
  return 'total'
}

function generateFunctionBody(
  rollDef: RollDefinition,
  spec: RandSumSpec,
  optional: boolean
): string[] {
  const validationLines = generateValidationLines(rollDef, spec, optional, '  ')

  // Delegate multi-pool rolls to dedicated generator
  if (rollDef.dicePools !== undefined) {
    return [...validationLines, ...generateMultiPoolBody(rollDef, spec)]
  }

  const lines: string[] = [...validationLines]

  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const needsDiceTotal = hasDetails && detailsNeedsDiceTotal(detailsDef)

  for (const rollCase of rollDef.when ?? []) {
    const cond = conditionCode(rollCase, optional)
    const overrideDice = rollCase.override.dice ?? rollDef.dice
    const overrideMod = rollCase.override.modify ?? rollDef.modify ?? []
    const overrideOutcome = rollCase.override.outcome ?? rollDef.outcome
    const overrideRanges = getOutcomeRanges(overrideOutcome, spec)
    if (overrideDice === undefined) {
      throw new SchemaError('INVALID_SPEC', 'when branch has no dice and no override.dice')
    }
    const diceCode = buildDiceOptionsCode(overrideDice, overrideMod, spec, rollDef.inputs, optional)
    const needsPre = overrideRanges.some(
      r => r.poolCondition !== undefined && r.poolCondition.pool !== 'postModify'
    )
    const needsPost = overrideRanges.some(r => r.poolCondition?.pool === 'postModify')

    const overridePostResolve =
      rollCase.override.postResolveModifiers ?? rollDef.postResolveModifiers
    const overrideTotalExpr = buildPostResolveTotalExpr(
      overridePostResolve,
      rollDef.inputs,
      optional
    )
    lines.push(`  if (${cond}) {`)
    lines.push(`    const r = executeRoll(${diceCode})`)
    if (needsPre) lines.push(`    const preModify = r.rolls.flatMap(x => x.initialRolls)`)
    if (needsPost) lines.push(`    const postModify = r.rolls.flatMap(x => x.rolls)`)
    if (hasDetails && needsDiceTotal) {
      lines.push(`    const diceTotal = r.total`)
    }
    lines.push(`    const total = ${overrideTotalExpr}`)
    if (hasDetails) {
      lines.push(...emitDetailsObjectCode(detailsDef, optional, '    '))
    }
    lines.push(
      ...generateOutcomeLines(
        overrideOutcome,
        spec,
        '    ',
        'r.rolls',
        rollDef.inputs,
        optional,
        hasDetails
      )
    )
    lines.push(`  }`)
  }

  if (rollDef.dice === undefined) {
    throw new SchemaError('INVALID_SPEC', 'rollDef.dice is required for single-pool roll')
  }
  const defaultDiceCode = buildDiceOptionsCode(
    rollDef.dice,
    rollDef.modify ?? [],
    spec,
    rollDef.inputs,
    optional
  )
  const defaultRanges = getOutcomeRanges(rollDef.outcome, spec)
  const needsPre = defaultRanges.some(
    r => r.poolCondition !== undefined && r.poolCondition.pool !== 'postModify'
  )
  const needsPost = defaultRanges.some(r => r.poolCondition?.pool === 'postModify')

  const totalExpr = buildPostResolveTotalExpr(
    rollDef.postResolveModifiers,
    rollDef.inputs,
    optional
  )
  lines.push(`  const r = executeRoll(${defaultDiceCode})`)
  if (needsPre) lines.push(`  const preModify = r.rolls.flatMap(x => x.initialRolls)`)
  if (needsPost) lines.push(`  const postModify = r.rolls.flatMap(x => x.rolls)`)

  // Capture diceTotal before post-resolve modifiers (for details)
  if (needsDiceTotal) {
    lines.push(`  const diceTotal = r.total`)
  }

  lines.push(`  const total = ${totalExpr}`)

  // Build details object if declared
  if (hasDetails) {
    lines.push(...emitDetailsObjectCode(detailsDef, optional, '  '))
  }

  // External table lookup replaces outcome lines with a find+resolve call
  if (typeof rollDef.resolve === 'object' && 'externalTableLookup' in rollDef.resolve) {
    const etl = rollDef.resolve.externalTableLookup
    const { find, resolve: etlResolve } = etl
    const keyAccessor = optional ? `input?.${find.where.input}` : `input.${find.where.input}`
    lines.push(
      `  const foundTable = ${find.collection}.find(t => t.${find.where.field} === ${keyAccessor})`
    )
    // Emit error message — custom template or default
    if (find.errorMessage !== undefined) {
      const escaped = find.errorMessage.replace(/`/g, '\\`')
      const template = escaped.replace('${value}', `\${${keyAccessor}}`)
      lines.push(`  if (!foundTable) throw new Error(\`${template}\`)`)
    } else {
      lines.push(`  if (!foundTable) throw new Error(\`No table found: \${${keyAccessor}}\`)`)
    }
    lines.push(
      `  const lookupResult = ${etlResolve.fn}(foundTable.${etlResolve.tableField}, total)`
    )
    // Emit return — either resultMapping or plain passthrough
    if (etl.resultMapping !== undefined) {
      const mappingFields = Object.entries(etl.resultMapping)
        .map(([fieldName, leaf]) => `    ${fieldName}: ${resultMappingLeafExpr(leaf, optional)}`)
        .join(',\n')
      const detailsPart = hasDetails ? ', details' : ''
      lines.push(
        `  return { total, result: {\n${mappingFields}\n  }, rolls: r.rolls${detailsPart} }`
      )
    } else {
      lines.push(
        hasDetails
          ? `  return { total, result: lookupResult, rolls: r.rolls, details }`
          : `  return { total, result: lookupResult, rolls: r.rolls }`
      )
    }
  } else {
    lines.push(
      ...generateOutcomeLines(
        rollDef.outcome,
        spec,
        '  ',
        'r.rolls',
        rollDef.inputs,
        optional,
        hasDetails
      )
    )
  }

  return lines
}

// --- Details field helpers ---

function isDetailsLeaf(def: DetailsFieldDef): def is DetailsLeafDef {
  if ('$input' in def || 'expr' in def || '$pool' in def || '$conditionalPool' in def) return true
  return false
}

function isConditionalDetails(def: DetailsFieldDef): def is {
  readonly when: { readonly input: string }
  readonly value: Readonly<Record<string, DetailsLeafDef>>
} {
  return 'when' in def && 'value' in def
}

function leafTsType(leaf: DetailsLeafDef, inputs: RollDefinition['inputs']): string {
  if ('expr' in leaf) return 'number'
  if ('$pool' in leaf) return 'number'
  if ('$conditionalPool' in leaf) return 'number'
  // $input — look up the input declaration
  const decl = inputs?.[leaf.$input]
  return decl?.type === 'integer' ? 'number' : decl?.type === 'boolean' ? 'boolean' : 'string'
}

function emitDetailsInterface(
  typeName: string,
  details: Readonly<Record<string, DetailsFieldDef>>,
  inputs: RollDefinition['inputs']
): string[] {
  const lines: string[] = [`export interface ${typeName} {`]
  for (const [fieldName, def] of Object.entries(details)) {
    if (isDetailsLeaf(def)) {
      lines.push(`  readonly ${fieldName}: ${leafTsType(def, inputs)}`)
    } else if (isConditionalDetails(def)) {
      // Conditional: { subField: type } | undefined
      const subFields = Object.entries(def.value)
        .map(([k, v]) => `readonly ${k}: ${leafTsType(v, inputs)}`)
        .join('; ')
      lines.push(`  readonly ${fieldName}: { ${subFields} } | undefined`)
    } else {
      // Nested object
      const nested = def
      const subFields = Object.entries(nested)
        .map(([k, v]) => `readonly ${k}: ${leafTsType(v, inputs)}`)
        .join('; ')
      lines.push(`  readonly ${fieldName}: { ${subFields} }`)
    }
  }
  lines.push(`}`)
  return lines
}

function leafValueCode(leaf: DetailsLeafDef, optional: boolean): string {
  if ('expr' in leaf) return leaf.expr
  if ('$pool' in leaf) return `${leaf.$pool}Total`
  if ('$conditionalPool' in leaf) return `conditionalPool${leaf.$conditionalPool}Total`
  const accessor = optional ? `input?.${leaf.$input}` : `input.${leaf.$input}`
  if (leaf.default !== undefined) {
    return `${accessor} ?? ${typeof leaf.default === 'string' ? `'${leaf.default}'` : String(leaf.default)}`
  }
  return accessor
}

function emitDetailsObjectCode(
  details: Readonly<Record<string, DetailsFieldDef>>,
  optional: boolean,
  indent: string
): string[] {
  const fields: string[] = []
  for (const [fieldName, def] of Object.entries(details)) {
    if (isDetailsLeaf(def)) {
      fields.push(`${indent}  ${fieldName}: ${leafValueCode(def, optional)}`)
    } else if (isConditionalDetails(def)) {
      const condAccessor = optional ? `input?.${def.when.input}` : `input.${def.when.input}`
      const subFields = Object.entries(def.value)
        .map(([k, v]) => `${k}: ${leafValueCode(v, optional)}`)
        .join(', ')
      fields.push(
        `${indent}  ${fieldName}: ${condAccessor} !== undefined ? { ${subFields} } : undefined`
      )
    } else {
      // Nested object
      const nested = def
      const subFields = Object.entries(nested)
        .map(([k, v]) => `${k}: ${leafValueCode(v, optional)}`)
        .join(', ')
      fields.push(`${indent}  ${fieldName}: { ${subFields} }`)
    }
  }
  return [`${indent}const details = {`, ...fields.map(f => `${f},`), `${indent}}`]
}

function detailsNeedsDiceTotal(details: Readonly<Record<string, DetailsFieldDef>>): boolean {
  for (const def of Object.values(details)) {
    if (isDetailsLeaf(def)) {
      if ('expr' in def && def.expr === 'diceTotal') return true
    } else if (isConditionalDetails(def)) {
      for (const v of Object.values(def.value)) {
        if ('expr' in v && v.expr === 'diceTotal') return true
      }
    } else {
      const nested = def
      for (const v of Object.values(nested)) {
        if ('expr' in v && v.expr === 'diceTotal') return true
      }
    }
  }
  return false
}

function detailsNeedsConditionalPool(
  details: Readonly<Record<string, DetailsFieldDef>>
): Set<number> {
  const indices = new Set<number>()
  for (const def of Object.values(details)) {
    if (isDetailsLeaf(def) && '$conditionalPool' in def) {
      indices.add(def.$conditionalPool)
    } else if (isConditionalDetails(def)) {
      for (const v of Object.values(def.value)) {
        if ('$conditionalPool' in v) indices.add(v.$conditionalPool)
      }
    } else if (!isDetailsLeaf(def)) {
      const nested = def
      for (const v of Object.values(nested)) {
        if ('$conditionalPool' in v) indices.add(v.$conditionalPool)
      }
    }
  }
  return indices
}

interface SingleInputOverload {
  readonly fieldName: string
  readonly tsType: string
  readonly baseType: 'number' | 'string' | 'boolean'
  readonly fieldOptional: boolean
}

function getSingleInputOverload(rollDef: RollDefinition): SingleInputOverload | null {
  const { inputs } = rollDef
  if (!inputs) return null
  const entries = Object.entries(inputs)
  if (entries.length !== 1) return null
  const first = entries[0]
  if (first === undefined) return null
  const [fieldName, decl] = first
  const tsType = inputTsType(decl)
  const baseType: 'number' | 'string' | 'boolean' =
    decl.type === 'integer' ? 'number' : decl.type === 'boolean' ? 'boolean' : 'string'
  const fieldOptional = isInputOptional(decl)
  return { fieldName, tsType, baseType, fieldOptional }
}

function generateRollParts(key: string, rollDef: RollDefinition, spec: RandSumSpec): string[] {
  const Key = capitalize(key)
  const results = collectResults(rollDef, spec)
  const optional = inputAllOptional(rollDef.inputs)
  const inputType = buildInputType(rollDef.inputs)
  const overload = getSingleInputOverload(rollDef)
  const isNumeric = results === null
  const isOpaqueString = results === 'string'

  const parts: string[] = []

  const isResultMapping = results === 'object'

  if (isResultMapping) {
    // Emit an interface for the resultMapping shape
    const etl = (rollDef.resolve as { readonly externalTableLookup: ExternalTableLookupOperation })
      .externalTableLookup
    const mapping = etl.resultMapping
    if (mapping !== undefined) {
      parts.push(`export interface ${Key}Result {`)
      for (const fieldName of Object.keys(mapping)) {
        // All resultMapping fields are opaque — use unknown for external refs, string for inputs, number for expr
        const leaf = mapping[fieldName]
        if (leaf === undefined) continue
        const fieldType = 'expr' in leaf ? 'number' : '$input' in leaf ? 'string' : 'unknown'
        parts.push(`  readonly ${fieldName}: ${fieldType}`)
      }
      parts.push(`}`)
    }
  } else if (isOpaqueString) {
    parts.push(`export type ${Key}Result = string`)
  } else if (isNumeric) {
    parts.push(`export type ${Key}Result = number`)
  } else {
    const resultUnion = results.map(r => `'${r}'`).join(' | ')
    parts.push(`export type ${Key}Result = ${resultUnion}`)
  }
  parts.push(``)

  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const detailsTypeName = hasDetails ? `${Key}Details` : 'undefined'

  if (hasDetails) {
    parts.push(...emitDetailsInterface(detailsTypeName, detailsDef, rollDef.inputs))
    parts.push(``)
  }

  const returnType = `GameRollResult<${Key}Result, ${detailsTypeName}, RollRecord>`

  if (overload) {
    const { fieldName, tsType, baseType, fieldOptional } = overload
    const nakedOpt = fieldOptional ? '?' : ''
    const objOpt = optional ? '?' : ''
    // Overload 1: naked scalar
    parts.push(`export function ${key}(${fieldName}${nakedOpt}: ${tsType}): ${returnType}`)
    // Overload 2: object form
    parts.push(`export function ${key}(input${objOpt}: ${inputType}): ${returnType}`)
    // Implementation signature
    const rawOpt = optional ? '?' : ''
    parts.push(
      `export function ${key}(rawInput${rawOpt}: ${tsType} | ${inputType}): ${returnType} {`
    )
    // Normalization: coerce naked scalar into object so function body is unchanged
    const fallback = optional ? ' ?? {}' : ''
    parts.push(
      `  const input: ${inputType} = typeof rawInput === '${baseType}' ? { ${fieldName}: rawInput } : rawInput${fallback}`
    )
  } else {
    const param = optional ? `input?: ${inputType}` : `input: ${inputType}`
    parts.push(`export function ${key}(${param}): ${returnType} {`)
  }

  parts.push(...generateFunctionBody(rollDef, spec, optional))
  parts.push(`}`)
  parts.push(``)

  return parts
}

function needsValidationImports(spec: RandSumSpec): { needsFinite: boolean; needsRange: boolean } {
  const patternKeys = Object.keys(spec).filter(k => /^roll[A-Z][a-zA-Z]*$/.test(k))
  const rollKeys = ['roll', ...patternKeys].filter(k => isRollDefinition(spec[k]))
  const allInputDecls = rollKeys.flatMap(key => {
    const rollDef = spec[key] as RollDefinition
    return rollDef.inputs ? Object.values(rollDef.inputs) : []
  })
  const needsFinite = allInputDecls.some(decl => decl.type === 'integer')
  const needsRange = allInputDecls.some(
    decl => decl.type === 'integer' && (decl.minimum !== undefined || decl.maximum !== undefined)
  )
  return { needsFinite, needsRange }
}

function generateValidationLines(
  rollDef: RollDefinition,
  spec: RandSumSpec,
  optional: boolean,
  indent: string
): string[] {
  if (!rollDef.inputs) return []
  const lines: string[] = []
  for (const [fieldName, decl] of Object.entries(rollDef.inputs)) {
    const accessor = optional ? `input?.${fieldName}` : `input.${fieldName}`
    const isOptionalField = isInputOptional(decl)
    const guard = isOptionalField ? `${accessor} !== undefined && ` : ''

    if (decl.type === 'integer') {
      const label = decl.description ?? `${spec.name} ${fieldName}`
      lines.push(
        `${indent}if (${guard}typeof ${accessor} === 'number') validateFinite(${accessor}, '${label}')`
      )
      if (decl.minimum !== undefined && decl.maximum !== undefined) {
        lines.push(
          `${indent}if (${guard}typeof ${accessor} === 'number') validateRange(${accessor}, ${decl.minimum}, ${decl.maximum}, '${label}')`
        )
      }
    }

    if (decl.type === 'string' && decl.enum !== undefined && decl.enum.length > 0) {
      const enumValues = decl.enum.map(v => `'${v}'`).join(', ')
      const enumList = decl.enum.map(v => `'${v}'`).join(' or ')
      lines.push(
        `${indent}if (${guard}![${enumValues}].includes(${accessor} as string)) throw new Error(\`Invalid ${fieldName} value: \${String(${accessor})}. Must be ${enumList}.\`)`
      )
    }
  }
  return lines
}

function collectExternalImports(spec: RandSumSpec): ReadonlyMap<string, ReadonlySet<string>> {
  const imports = new Map<string, Set<string>>()
  const patternKeys = Object.keys(spec).filter(k => /^roll[A-Z][a-zA-Z]*$/.test(k))
  const rollKeys = ['roll', ...patternKeys].filter(k => isRollDefinition(spec[k]))

  for (const key of rollKeys) {
    const rollDef = spec[key] as RollDefinition
    const resolve = rollDef.resolve
    if (typeof resolve === 'object' && 'externalTableLookup' in resolve) {
      const { package: pkg, imports: importNames } = resolve.externalTableLookup
      const existing = imports.get(pkg) ?? new Set<string>()
      for (const name of importNames) {
        existing.add(name)
      }
      imports.set(pkg, existing)
    }
  }

  return imports
}

function buildCodeString(spec: RandSumSpec): string {
  const patternKeys = Object.keys(spec).filter(k => /^roll[A-Z][a-zA-Z]*$/.test(k))
  const rollKeys = ['roll', ...patternKeys].filter(k => isRollDefinition(spec[k]))

  const { needsFinite, needsRange } = needsValidationImports(spec)
  const validationImports: string[] = []
  if (needsFinite) validationImports.push('validateFinite')
  if (needsRange) validationImports.push('validateRange')
  const runtimeImports = ['executeRoll', ...validationImports].join(', ')

  const parts: string[] = [
    `/* eslint-disable */`,
    `// Auto-generated from ${spec.name} spec. Run \`bun run codegen\` to regenerate.`,
    `// Do not edit this file manually.`,
    `import { ${runtimeImports} } from '@randsum/gameSchema'`,
    `import type { GameRollResult, RollRecord } from '@randsum/gameSchema'`
  ]

  const externalImports = collectExternalImports(spec)
  for (const [pkg, exports] of externalImports) {
    parts.push(`import { ${[...exports].join(', ')} } from '${pkg}'`)
  }
  parts.push(``)

  for (const key of rollKeys) {
    const rollDef = spec[key] as RollDefinition
    parts.push(...generateRollParts(key, rollDef, spec))
  }

  parts.push(`export type { GameRollResult, RollRecord }`)
  parts.push(``)

  return parts.join('\n')
}

/**
 * Generate TypeScript roll functions from a spec.
 *
 * @param spec - The parsed .randsum.json spec
 * @param outputDir - If provided, writes the generated file to this directory
 *                    (named after the spec) and returns the full filepath.
 *                    Otherwise returns the code string.
 */
export function generateCode(spec: RandSumSpec, outputDir?: string): string {
  const result = validateSpec(spec)
  if (!result.valid) {
    const summary = result.errors.map(e => `${e.path}: ${e.message}`).join('; ')
    throw new SchemaError('INVALID_SPEC', `Invalid spec: ${summary}`)
  }

  const code = buildCodeString(spec)

  if (outputDir !== undefined) {
    const filename = `${spec.shortcode}.ts`
    const dir = resolve(outputDir)
    mkdirSync(dir, { recursive: true })
    const filepath = join(dir, filename)
    writeFileSync(filepath, code, 'utf-8')
    return filepath
  }

  return code
}
