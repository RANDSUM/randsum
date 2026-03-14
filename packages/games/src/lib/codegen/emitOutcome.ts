import type { NormalizedOutcome, NormalizedRollDefinition } from '../normalizedTypes'
import type { DegreeOfSuccessOperation, ResultMappingLeaf, TableRange } from '../types'
import { getOutcomeRanges, integerOrInputCode } from './emitHelpers'

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

export function buildRangeReturn(
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

export function generateOutcomeLines(
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

export function resultMappingLeafTsType(leaf: ResultMappingLeaf): string {
  if ('expr' in leaf) return 'number'
  if ('$input' in leaf) return 'string'
  if ('$lookupResult' in leaf) return 'string'
  if ('$foundTable' in leaf) return 'Record<string, unknown>'
  return 'unknown'
}

export function resultMappingLeafExpr(leaf: ResultMappingLeaf, optional: boolean): string {
  if ('$lookupResult' in leaf) {
    const primary = `lookupResult.${leaf.$lookupResult}`
    if (leaf.fallback !== undefined) {
      return `${primary} ?? ${resultMappingLeafExpr(leaf.fallback, optional)}`
    }
    return `${primary} ?? ''`
  }
  if ('$foundTable' in leaf) return `foundTable.${leaf.$foundTable}`
  if ('$input' in leaf) {
    return optional ? `input?.${leaf.$input}` : `input.${leaf.$input}`
  }
  return 'total'
}
