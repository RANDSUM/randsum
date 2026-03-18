import { SchemaError } from '../errors'
import type { NormalizedRollDefinition } from '../normalizedTypes'
import type { RemoteTableLookupOperation } from '../types'
import {
  detailsNeedsConditionalPool,
  detailsNeedsDiceTotal,
  emitDetailsInterface,
  emitDetailsObjectCode
} from './emitDetails'
import {
  buildInputType,
  buildPostResolveTotalExpr,
  capitalize,
  collectResults,
  conditionCode,
  conditionCodeFromCondition,
  generateValidationLines,
  getOutcomeRanges,
  getSingleInputOverload,
  hasEffectivePostResolveModifiers,
  inputAllOptional,
  integerOrInputCode,
  toPascalCase
} from './emitHelpers'
import { buildDiceOptionsCode } from './emitModifiers'
import { generateOutcomeLines, resultMappingLeafExpr, resultMappingLeafTsType } from './emitOutcome'

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
      throw new SchemaError('when branch has no dice and no override.dice', 'INVALID_SPEC')
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
    lines.push(`  if (${cond}) {`)
    lines.push(`    const r = executeRoll(${diceCode})`)
    if (needsPre) lines.push(`    const preModify = r.rolls.flatMap(x => x.initialRolls)`)
    if (needsPost) lines.push(`    const postModify = r.rolls.flatMap(x => x.rolls)`)
    if (hasDetails && needsDiceTotal) {
      lines.push(`    const diceTotal = r.rolls.flatMap(x => x.rolls).reduce((a, b) => a + b, 0)`)
    }
    lines.push(`    const total = ${overrideTotalExpr}`)
    if (hasDetails) {
      lines.push(...emitDetailsObjectCode(detailsDef, optional, '    ', 'diceTotal'))
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
    throw new SchemaError('rollDef.dice is required for single-pool roll', 'INVALID_SPEC')
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
  lines.push(`  const r = executeRoll(${defaultDiceCode})`)
  if (needsPre) lines.push(`  const preModify = r.rolls.flatMap(x => x.initialRolls)`)
  if (needsPost) lines.push(`  const postModify = r.rolls.flatMap(x => x.rolls)`)

  // Compute raw dice sum (sum of kept dice before arithmetic modifiers like plus/minus)
  if (needsDiceTotal) {
    lines.push(`  const diceTotal = r.rolls.flatMap(x => x.rolls).reduce((a, b) => a + b, 0)`)
  }

  lines.push(`  const total = ${totalExpr}`)

  // Build details object if declared
  if (hasDetails) {
    lines.push(...emitDetailsObjectCode(detailsDef, optional, '  ', 'diceTotal'))
  }

  // Remote table lookup replaces outcome lines with a find+lookupByRange call
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    const rtl = rollDef.resolve.remoteTableLookup
    const { find, tableField } = rtl
    const keyAccessor = optional ? `input?.${find.input}` : `input.${find.input}`
    lines.push(`  const foundTable = REMOTE_DATA.find(t => t.${find.field} === ${keyAccessor})`)
    // Emit error message — custom template or default
    if (find.errorMessage !== undefined) {
      const escaped = find.errorMessage.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
      const template = escaped.replace('${value}', `\${${keyAccessor}}`)
      lines.push(`  if (!foundTable) throw new SchemaError(\`${template}\`, 'NO_TABLE_MATCH')`)
    } else {
      lines.push(
        `  if (!foundTable) throw new SchemaError(\`No table found: \${${keyAccessor}}\`, 'NO_TABLE_MATCH')`
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

export function generateRollParts(
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
  parts.push(``)

  const detailsDef = rollDef.details
  const hasDetails = detailsDef !== undefined && Object.keys(detailsDef).length > 0
  const prefixedDetailsName = hasDetails ? `${PascalShortcode}${Key}Details` : undefined
  const detailsTypeName = prefixedDetailsName ?? 'undefined'

  if (hasDetails && prefixedDetailsName !== undefined) {
    parts.push(...emitDetailsInterface(prefixedDetailsName, detailsDef, rollDef.inputs))
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
