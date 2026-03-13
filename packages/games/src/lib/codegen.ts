import { SchemaError } from './errors'
import type {
  NormalizedDetailsFieldDef,
  NormalizedDetailsLeafDef,
  NormalizedDiceConfig,
  NormalizedOutcome,
  NormalizedRollCase,
  NormalizedRollDefinition,
  NormalizedSpec
} from './normalizedTypes'
import { normalizeSpec } from './normalizer'
import type {
  Condition,
  DegreeOfSuccessOperation,
  InputDeclaration,
  IntegerOrInput,
  ModifyOperation,
  PostResolveModifyOperation,
  RandSumSpec,
  RemoteTableLookupOperation,
  ResultMappingLeaf,
  TableRange
} from './types'
import { validateSpec } from './validator'

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function toPascalCase(str: string): string {
  return str.split('-').map(capitalize).join('')
}

export function specToFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function toDiceConfig(
  dice: NormalizedDiceConfig | readonly NormalizedDiceConfig[]
): NormalizedDiceConfig {
  if ('pool' in dice) return dice
  const [first] = dice
  if (first === undefined) throw new SchemaError('INVALID_SPEC', 'dice array is empty')
  return first
}

function inputAllOptional(inputs: NormalizedRollDefinition['inputs']): boolean {
  if (!inputs || Object.keys(inputs).length === 0) return true
  return Object.values(inputs).every(isInputOptional)
}

function integerOrInputCode(
  val: IntegerOrInput,
  inputs: NormalizedRollDefinition['inputs'],
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

function buildInputType(inputs: NormalizedRollDefinition['inputs']): string {
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
  inputs: NormalizedRollDefinition['inputs'],
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
  const firstAddOp = addOps[0]
  if (addOps.length === 1 && firstAddOp !== undefined) {
    mods.push(`plus: ${integerOrInputCode(firstAddOp.add, inputs, optional)}`)
  } else if (addOps.length > 1) {
    const sum = addOps.map(op => integerOrInputCode(op.add, inputs, optional)).join(' + ')
    mods.push(`plus: ${sum}`)
  }
  if (mods.length === 0) return null
  return `modifiers: { ${mods.join(', ')} }`
}

function buildDiceOptionsCode(
  dice: NormalizedDiceConfig | readonly NormalizedDiceConfig[],
  modify: readonly ModifyOperation[] | undefined,
  inputs: Readonly<Record<string, InputDeclaration>> | undefined,
  optional: boolean
): string {
  const dc = toDiceConfig(dice)
  const pool = dc.pool
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

function conditionCode(rollCase: NormalizedRollCase, optional: boolean): string {
  return conditionCodeFromCondition(rollCase.condition, optional)
}

function getOutcomeRanges(outcome: NormalizedOutcome | undefined): readonly TableRange[] {
  if (!outcome) return []
  if ('ranges' in outcome) return outcome.ranges
  if ('tableLookup' in outcome) return outcome.tableLookup.ranges
  return []
}

function getResultStrings(outcome: NormalizedOutcome | undefined): string[] {
  if (outcome === undefined) return []
  if ('degreeOfSuccess' in outcome) {
    return Object.keys(outcome.degreeOfSuccess)
  }
  return getOutcomeRanges(outcome).map(r => r.result)
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
      : `${indent}throw new SchemaError('NO_TABLE_MATCH', \`No degree of success matches total \${total}\`)`
  return [...ifLines, defaultLine]
}

type CollectedResults =
  | { readonly kind: 'union'; readonly values: readonly string[] }
  | { readonly kind: 'numeric' }
  | { readonly kind: 'opaque' }
  | { readonly kind: 'result-mapping' }

function collectResults(rollDef: NormalizedRollDefinition): CollectedResults {
  // remoteTableLookup: always has resultMapping
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    return { kind: 'result-mapping' }
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
      return {
        kind: 'union',
        values: [...new Set([...Object.values(op.outcomes), tieResult])].sort()
      }
    }
    return { kind: 'numeric' }
  }
  // No outcome — numeric passthrough
  if (rollDef.outcome === undefined) return { kind: 'numeric' }
  const defaultResults = getResultStrings(rollDef.outcome)
  const whenResults = (rollDef.when ?? []).flatMap(wc =>
    wc.override.outcome ? getResultStrings(wc.override.outcome) : []
  )
  const values = [...new Set([...defaultResults, ...whenResults])].sort()
  if (values.length === 0) return { kind: 'opaque' }
  return { kind: 'union', values }
}

function buildRangeReturn(
  range: TableRange,
  indent: string,
  inputs: NormalizedRollDefinition['inputs'],
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

function hasEffectivePostResolveModifiers(
  postResolveModifiers: NormalizedRollDefinition['postResolveModifiers']
): boolean {
  if (!postResolveModifiers || postResolveModifiers.length === 0) return false
  return postResolveModifiers.some(op => op.add !== undefined)
}

function buildPostResolveTotalExpr(
  postResolveModifiers: NormalizedRollDefinition['postResolveModifiers'],
  inputs: NormalizedRollDefinition['inputs'],
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

function generateMultiPoolBody(rollDef: NormalizedRollDefinition): string[] {
  const { dicePools, resolve } = rollDef
  if (dicePools === undefined) return []

  const lines: string[] = []
  const poolNames = Object.keys(dicePools)

  const optional = inputAllOptional(rollDef.inputs)

  // Emit one executeRoll per pool
  for (const poolName of poolNames) {
    const dc = dicePools[poolName]
    if (dc === undefined) continue
    const pool = dc.pool
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

  // Emit conditional pools (track totals by name for $conditionalPool details refs)
  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const cpNamesNeeded = hasDetails ? detailsNeedsConditionalPool(detailsDef) : new Set<string>()

  if (rollDef.conditionalPools !== undefined && Object.keys(rollDef.conditionalPools).length > 0) {
    // Pre-declare conditionalPool_<name>Total variables for details refs
    for (const name of cpNamesNeeded) {
      lines.push(`  let conditionalPool_${name}Total = 0`)
    }
    for (const [name, cp] of Object.entries(rollDef.conditionalPools)) {
      const cond = conditionCodeFromCondition(cp.condition, optional)
      const cpPool = cp.pool
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
      if (cpNamesNeeded.has(name)) {
        lines.push(`    conditionalPool_${name}Total = cpTotal`)
      }
      lines.push(`    total ${sign} cpTotal`)
      lines.push(`    rolls.push(...cpResult.rolls)`)
      lines.push(`  }`)
    }
  }

  // Capture diceTotal for details (sum of base pools, before postResolve)
  const needsDiceTotal = hasDetails && detailsNeedsDiceTotal(detailsDef)
  const multiPoolHasPostResolve = hasEffectivePostResolveModifiers(rollDef.postResolveModifiers)
  const multiPoolDiceTotalAlias = multiPoolHasPostResolve ? 'diceTotal' : 'total'
  if (needsDiceTotal && multiPoolHasPostResolve) {
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
    lines.push(...emitDetailsObjectCode(detailsDef, optional, '  ', multiPoolDiceTotalAlias))
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
  outcome: NormalizedOutcome | undefined,
  indent: string,
  rollsExpr: string,
  inputs: NormalizedRollDefinition['inputs'],
  optional: boolean,
  hasDetails = false
): string[] {
  const detailsPart = hasDetails ? ', details' : ''

  if (outcome === undefined) {
    return [`${indent}return { total, result: total, rolls: ${rollsExpr}${detailsPart} }`]
  }

  if ('degreeOfSuccess' in outcome) {
    return generateDegreeLines(outcome.degreeOfSuccess, indent, rollsExpr, hasDetails)
  }

  const ranges = getOutcomeRanges(outcome)
  const lines: string[] = []
  for (const range of ranges) {
    const check = buildRangeReturn(range, indent, inputs, optional, hasDetails)
    if (check) lines.push(check)
  }
  lines.push(
    `${indent}throw new SchemaError('NO_TABLE_MATCH', \`No table entry matches total \${total}\`)`
  )
  return lines
}

function resultMappingLeafTsType(leaf: ResultMappingLeaf): string {
  if ('expr' in leaf) return 'number'
  if ('$input' in leaf) return 'string'
  if ('$lookupResult' in leaf) return 'string'
  if ('$foundTable' in leaf) return 'Record<string, unknown>'
  return 'unknown'
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
  rollDef: NormalizedRollDefinition,
  optional: boolean,
  specName: string
): string[] {
  const validationLines = generateValidationLines(rollDef, optional, '  ', specName)

  // Delegate multi-pool rolls to dedicated generator
  if (rollDef.dicePools !== undefined) {
    return [...validationLines, ...generateMultiPoolBody(rollDef)]
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
    const overrideRanges = getOutcomeRanges(overrideOutcome)
    if (overrideDice === undefined) {
      throw new SchemaError('INVALID_SPEC', 'when branch has no dice and no override.dice')
    }
    const diceCode = buildDiceOptionsCode(overrideDice, overrideMod, rollDef.inputs, optional)
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
    const branchHasPostResolve = hasEffectivePostResolveModifiers(overridePostResolve)
    const branchDiceTotalAlias = branchHasPostResolve ? 'diceTotal' : 'total'
    lines.push(`  if (${cond}) {`)
    lines.push(`    const r = executeRoll(${diceCode})`)
    if (needsPre) lines.push(`    const preModify = r.rolls.flatMap(x => x.initialRolls)`)
    if (needsPost) lines.push(`    const postModify = r.rolls.flatMap(x => x.rolls)`)
    if (hasDetails && needsDiceTotal && branchHasPostResolve) {
      lines.push(`    const diceTotal = r.total`)
    }
    lines.push(`    const total = ${overrideTotalExpr}`)
    if (hasDetails) {
      lines.push(...emitDetailsObjectCode(detailsDef, optional, '    ', branchDiceTotalAlias))
    }
    lines.push(
      ...generateOutcomeLines(
        overrideOutcome,
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
    rollDef.inputs,
    optional
  )
  const defaultRanges = getOutcomeRanges(rollDef.outcome)
  const needsPre = defaultRanges.some(
    r => r.poolCondition !== undefined && r.poolCondition.pool !== 'postModify'
  )
  const needsPost = defaultRanges.some(r => r.poolCondition?.pool === 'postModify')

  const totalExpr = buildPostResolveTotalExpr(
    rollDef.postResolveModifiers,
    rollDef.inputs,
    optional
  )
  const defaultHasPostResolve = hasEffectivePostResolveModifiers(rollDef.postResolveModifiers)
  const defaultDiceTotalAlias = defaultHasPostResolve ? 'diceTotal' : 'total'
  lines.push(`  const r = executeRoll(${defaultDiceCode})`)
  if (needsPre) lines.push(`  const preModify = r.rolls.flatMap(x => x.initialRolls)`)
  if (needsPost) lines.push(`  const postModify = r.rolls.flatMap(x => x.rolls)`)

  // Capture diceTotal before post-resolve modifiers (only when they differ)
  if (needsDiceTotal && defaultHasPostResolve) {
    lines.push(`  const diceTotal = r.total`)
  }

  lines.push(`  const total = ${totalExpr}`)

  // Build details object if declared
  if (hasDetails) {
    lines.push(...emitDetailsObjectCode(detailsDef, optional, '  ', defaultDiceTotalAlias))
  }

  // Remote table lookup replaces outcome lines with a find+lookupByRange call
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    const rtl = rollDef.resolve.remoteTableLookup
    const { find, tableField } = rtl
    const keyAccessor = optional ? `input?.${find.input}` : `input.${find.input}`
    lines.push(`  const foundTable = REMOTE_DATA.find(t => t.${find.field} === ${keyAccessor})`)
    // Emit error message — custom template or default
    if (find.errorMessage !== undefined) {
      const escaped = find.errorMessage.replace(/`/g, '\\`')
      const template = escaped.replace('${value}', `\${${keyAccessor}}`)
      lines.push(`  if (!foundTable) throw new SchemaError('NO_TABLE_MATCH', \`${template}\`)`)
    } else {
      lines.push(
        `  if (!foundTable) throw new SchemaError('NO_TABLE_MATCH', \`No table found: \${${keyAccessor}}\`)`
      )
    }
    lines.push(`  const lookupResult = lookupByRange(foundTable.${tableField}, total)`)
    // Always has resultMapping
    const mappingFields = Object.entries(rtl.resultMapping)
      .map(([fieldName, leaf]) => `    ${fieldName}: ${resultMappingLeafExpr(leaf, optional)}`)
      .join(',\n')
    const detailsPart = hasDetails ? ', details' : ''
    lines.push(`  return { total, result: {\n${mappingFields}\n  }, rolls: r.rolls${detailsPart} }`)
  } else {
    lines.push(
      ...generateOutcomeLines(
        rollDef.outcome,
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

function normalizedLeafTsType(
  leaf: NormalizedDetailsLeafDef,
  inputs: NormalizedRollDefinition['inputs']
): string {
  if ('expr' in leaf) return 'number'
  if ('$pool' in leaf) return 'number'
  if ('$conditionalPool' in leaf) return 'number'
  // $input — look up the input declaration
  const decl = inputs?.[leaf.$input]
  return decl?.type === 'integer' ? 'number' : decl?.type === 'boolean' ? 'boolean' : 'string'
}

function emitDetailsInterface(
  typeName: string,
  details: Readonly<Record<string, NormalizedDetailsFieldDef>>,
  inputs: NormalizedRollDefinition['inputs']
): string[] {
  const lines: string[] = [`export interface ${typeName} {`]
  for (const [fieldName, def] of Object.entries(details)) {
    switch (def.kind) {
      case 'leaf':
        lines.push(`  readonly ${fieldName}: ${normalizedLeafTsType(def.def, inputs)}`)
        break
      case 'conditional': {
        const subFields = Object.entries(def.fields)
          .map(([k, v]) => `readonly ${k}: ${normalizedLeafTsType(v, inputs)}`)
          .join('; ')
        lines.push(`  readonly ${fieldName}: { ${subFields} } | undefined`)
        break
      }
      case 'nested': {
        const subFields = Object.entries(def.fields)
          .map(([k, v]) => `readonly ${k}: ${normalizedLeafTsType(v, inputs)}`)
          .join('; ')
        lines.push(`  readonly ${fieldName}: { ${subFields} }`)
        break
      }
    }
  }
  lines.push(`}`)
  return lines
}

function normalizedLeafValueCode(
  leaf: NormalizedDetailsLeafDef,
  optional: boolean,
  diceTotalAlias: string
): string {
  if ('expr' in leaf) return leaf.expr === 'diceTotal' ? diceTotalAlias : leaf.expr
  if ('$pool' in leaf) return `${leaf.$pool}Total`
  if ('$conditionalPool' in leaf) return `conditionalPool_${leaf.$conditionalPool}Total`
  const accessor = optional ? `input?.${leaf.$input}` : `input.${leaf.$input}`
  if (leaf.default !== undefined) {
    return `${accessor} ?? ${typeof leaf.default === 'string' ? `'${leaf.default}'` : String(leaf.default)}`
  }
  return accessor
}

function emitDetailsObjectCode(
  details: Readonly<Record<string, NormalizedDetailsFieldDef>>,
  optional: boolean,
  indent: string,
  diceTotalAlias = 'diceTotal'
): string[] {
  const fields: string[] = []
  for (const [fieldName, def] of Object.entries(details)) {
    switch (def.kind) {
      case 'leaf':
        fields.push(
          `${indent}  ${fieldName}: ${normalizedLeafValueCode(def.def, optional, diceTotalAlias)}`
        )
        break
      case 'conditional': {
        const condAccessor = optional ? `input?.${def.when.input}` : `input.${def.when.input}`
        const subFields = Object.entries(def.fields)
          .map(([k, v]) => `${k}: ${normalizedLeafValueCode(v, optional, diceTotalAlias)}`)
          .join(', ')
        fields.push(
          `${indent}  ${fieldName}: ${condAccessor} !== undefined ? { ${subFields} } : undefined`
        )
        break
      }
      case 'nested': {
        const subFields = Object.entries(def.fields)
          .map(([k, v]) => `${k}: ${normalizedLeafValueCode(v, optional, diceTotalAlias)}`)
          .join(', ')
        fields.push(`${indent}  ${fieldName}: { ${subFields} }`)
        break
      }
    }
  }
  return [`${indent}const details = {`, ...fields.map(f => `${f},`), `${indent}}`]
}

function detailsNeedsDiceTotal(
  details: Readonly<Record<string, NormalizedDetailsFieldDef>>
): boolean {
  for (const def of Object.values(details)) {
    switch (def.kind) {
      case 'leaf':
        if ('expr' in def.def && def.def.expr === 'diceTotal') return true
        break
      case 'conditional':
        for (const v of Object.values(def.fields)) {
          if ('expr' in v && v.expr === 'diceTotal') return true
        }
        break
      case 'nested':
        for (const v of Object.values(def.fields)) {
          if ('expr' in v && v.expr === 'diceTotal') return true
        }
        break
    }
  }
  return false
}

function detailsNeedsConditionalPool(
  details: Readonly<Record<string, NormalizedDetailsFieldDef>>
): Set<string> {
  const names = new Set<string>()
  for (const def of Object.values(details)) {
    switch (def.kind) {
      case 'leaf':
        if ('$conditionalPool' in def.def) names.add(def.def.$conditionalPool)
        break
      case 'conditional':
        for (const v of Object.values(def.fields)) {
          if ('$conditionalPool' in v) names.add(v.$conditionalPool)
        }
        break
      case 'nested':
        for (const v of Object.values(def.fields)) {
          if ('$conditionalPool' in v) names.add(v.$conditionalPool)
        }
        break
    }
  }
  return names
}

interface SingleInputOverload {
  readonly fieldName: string
  readonly tsType: string
  readonly baseType: 'number' | 'string' | 'boolean'
  readonly fieldOptional: boolean
}

function getSingleInputOverload(rollDef: NormalizedRollDefinition): SingleInputOverload | null {
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

function generateRollParts(
  key: string,
  rollDef: NormalizedRollDefinition,
  specName: string,
  shortcode: string
): string[] {
  const Key = capitalize(key)
  const PascalShortcode = toPascalCase(shortcode)
  const prefixedResultName = `${PascalShortcode}${Key}Result`
  const results = collectResults(rollDef)
  const optional = inputAllOptional(rollDef.inputs)
  const inputType = buildInputType(rollDef.inputs)
  const overload = getSingleInputOverload(rollDef)

  const parts: string[] = []

  switch (results.kind) {
    case 'result-mapping': {
      // Emit an interface for the resultMapping shape
      const rtl = (rollDef.resolve as { readonly remoteTableLookup: RemoteTableLookupOperation })
        .remoteTableLookup
      const mapping = rtl.resultMapping
      parts.push(`export interface ${prefixedResultName} {`)
      for (const fieldName of Object.keys(mapping)) {
        const leaf = mapping[fieldName]
        if (leaf === undefined) continue
        const fieldType = resultMappingLeafTsType(leaf)
        parts.push(`  readonly ${fieldName}: ${fieldType}`)
      }
      parts.push(`}`)
      break
    }
    case 'opaque':
      parts.push(`export type ${prefixedResultName} = string`)
      break
    case 'numeric':
      parts.push(`export type ${prefixedResultName} = number`)
      break
    case 'union': {
      const resultUnion = results.values.map(r => `'${r}'`).join(' | ')
      parts.push(`export type ${prefixedResultName} = ${resultUnion}`)
      break
    }
  }
  // Backward-compatible alias
  parts.push(
    `/** @deprecated Use {@link ${prefixedResultName}} to avoid cross-game name collisions */`
  )
  parts.push(`export type ${Key}Result = ${prefixedResultName}`)
  parts.push(``)

  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const prefixedDetailsName = hasDetails ? `${PascalShortcode}${Key}Details` : undefined
  const detailsTypeName = hasDetails ? (prefixedDetailsName as string) : 'undefined'

  if (hasDetails && prefixedDetailsName !== undefined) {
    parts.push(...emitDetailsInterface(prefixedDetailsName, detailsDef, rollDef.inputs))
    parts.push(
      `/** @deprecated Use {@link ${prefixedDetailsName}} to avoid cross-game name collisions */`
    )
    parts.push(`export type ${Key}Details = ${prefixedDetailsName}`)
    parts.push(``)
  }

  const returnType = `GameRollResult<${prefixedResultName}, ${detailsTypeName}, RollRecord>`

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

  parts.push(...generateFunctionBody(rollDef, optional, specName))
  parts.push(`}`)
  parts.push(``)

  return parts
}

function needsValidationImports(nspec: NormalizedSpec): {
  needsFinite: boolean
  needsRange: boolean
} {
  const allInputDecls = Object.values(nspec.rolls).flatMap(rollDef => {
    return rollDef.inputs ? Object.values(rollDef.inputs) : []
  })
  const needsFinite = allInputDecls.some(decl => decl.type === 'integer')
  const needsRange = allInputDecls.some(
    decl => decl.type === 'integer' && (decl.minimum !== undefined || decl.maximum !== undefined)
  )
  return { needsFinite, needsRange }
}

function generateValidationLines(
  rollDef: NormalizedRollDefinition,
  optional: boolean,
  indent: string,
  specName: string
): string[] {
  if (!rollDef.inputs) return []
  const lines: string[] = []
  for (const [fieldName, decl] of Object.entries(rollDef.inputs)) {
    const accessor = optional ? `input?.${fieldName}` : `input.${fieldName}`
    const isOptionalField = isInputOptional(decl)
    const guard = isOptionalField ? `${accessor} !== undefined && ` : ''

    if (decl.type === 'integer') {
      const label = decl.description ?? `${specName} ${fieldName}`
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
        `${indent}if (${guard}![${enumValues}].includes(${accessor} as string)) throw new SchemaError('INVALID_INPUT_TYPE', \`Invalid ${fieldName} value: \${String(${accessor})}. Must be ${enumList}.\`)`
      )
    }
  }
  return lines
}

async function fetchRemoteData(url: string, dataPath?: string): Promise<unknown[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new SchemaError(
      'INVALID_SPEC',
      `Failed to fetch remote table data from ${url}: ${String(response.status)}`
    )
  }
  const json: unknown = await response.json()
  if (dataPath === undefined) return json as unknown[]
  const traversed = dataPath
    .split('.')
    .reduce((acc: unknown, part: string) => (acc as Record<string, unknown>)[part], json)
  return traversed as unknown[]
}

async function buildCodeString(nspec: NormalizedSpec): Promise<string> {
  const rollKeys = Object.keys(nspec.rolls)

  // Detect remoteTableLookup and fetch data at codegen time
  const rtlDef = Object.values(nspec.rolls).find(
    (
      rollDef
    ): rollDef is NormalizedRollDefinition & {
      resolve: { readonly remoteTableLookup: RemoteTableLookupOperation }
    } => typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve
  )?.resolve.remoteTableLookup
  const remoteData: unknown[] | undefined = rtlDef
    ? await fetchRemoteData(rtlDef.url, rtlDef.dataPath)
    : undefined

  const { needsFinite, needsRange } = needsValidationImports(nspec)
  const validationImports: string[] = []
  if (needsFinite) validationImports.push('validateFinite')
  if (needsRange) validationImports.push('validateRange')
  const hasRemote = remoteData !== undefined
  const validationPart = validationImports.length > 0 ? `, ${validationImports.join(', ')}` : ''

  const parts: string[] = [
    `/* eslint-disable */`,
    `// Auto-generated from ${nspec.name} spec. Run \`bun run codegen\` to regenerate.`,
    `// Do not edit this file manually.`,
    `import { roll as executeRoll${validationPart} } from '@randsum/roller'`,
    `import type { RollRecord } from '@randsum/roller'`,
    `import type { GameRollResult } from './types'`,
    `import { SchemaError } from './lib/errors'`,
    `import type { SchemaErrorCode } from './lib/errors'`
  ]

  if (hasRemote) {
    parts.push(`import { lookupByRange } from './lib/lookupByRange'`)
  }

  parts.push(``)

  if (remoteData !== undefined) {
    parts.push(`const REMOTE_DATA = ${JSON.stringify(remoteData)} as const`)
    parts.push(``)
  }

  for (const [key, rollDef] of Object.entries(nspec.rolls)) {
    parts.push(...generateRollParts(key, rollDef, nspec.name, nspec.shortcode))
  }

  parts.push(`export { SchemaError }`)
  parts.push(`export type { GameRollResult, RollRecord, SchemaErrorCode }`)

  if (remoteData !== undefined) {
    parts.push(``)
    parts.push(`export const ROLL_TABLE_ENTRIES: typeof REMOTE_DATA = REMOTE_DATA`)
    const tableNames = remoteData
      .map(entry => (entry as Record<string, unknown>)['name'] as string)
      .filter((name): name is string => typeof name === 'string')
    const namesLiteral = tableNames.map(n => `  '${n.replace(/'/g, "\\'")}'`).join(',\n')
    parts.push(`export const VALID_TABLE_NAMES = [\n${namesLiteral}\n] as const`)
  }

  parts.push(``)

  return parts.join('\n')
}

/**
 * Generate TypeScript roll functions from a spec.
 *
 * @param spec - The parsed .randsum.json spec
 */
export async function generateCode(spec: RandSumSpec): Promise<string> {
  const result = validateSpec(spec)
  if (!result.valid) {
    const summary = result.errors.map(e => `${e.path}: ${e.message}`).join('; ')
    throw new SchemaError('INVALID_SPEC', `Invalid spec: ${summary}`)
  }

  const nspec = normalizeSpec(spec)
  return buildCodeString(nspec)
}
