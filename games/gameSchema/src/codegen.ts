import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { SchemaError } from './errors'
import { isRef, resolveRef } from './refResolver'
import type {
  DiceConfig,
  InputDeclaration,
  IntegerOrInput,
  ModifyOperation,
  OutcomeOperation,
  PoolDefinition,
  RandSumSpec,
  Ref,
  RollCase,
  RollDefinition,
  TableRange
} from './types'
import { validateSpec } from './validator'

function isRollDefinition(value: unknown): value is RollDefinition {
  return typeof value === 'object' && value !== null && 'dice' in value && 'resolve' in value
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
  return Object.values(inputs).every(decl => decl.default !== undefined)
}

function integerOrInputCode(
  val: IntegerOrInput,
  inputs: RollDefinition['inputs'],
  optional: boolean
): string {
  if (typeof val === 'number') return String(val)
  const fieldName = val.$input
  const decl = inputs?.[fieldName]
  const accessor = optional ? `input?.${fieldName}` : `input.${fieldName}`
  if (decl?.default !== undefined) {
    return `(${accessor} ?? ${String(decl.default)})`
  }
  return accessor
}

function buildInputType(inputs: RollDefinition['inputs']): string {
  if (!inputs || Object.keys(inputs).length === 0) return 'Record<string, never>'
  const fields = Object.entries(inputs).map(([name, decl]: [string, InputDeclaration]) => {
    const tsType =
      decl.type === 'integer' ? 'number' : decl.type === 'boolean' ? 'boolean' : 'string'
    const opt = decl.default !== undefined ? '?' : ''
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
    if (op.add !== undefined) {
      mods.push(`plus: ${integerOrInputCode(op.add, inputs, optional)}`)
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

function conditionCode(rollCase: RollCase, optional: boolean): string {
  const tsOp = rollCase.condition.operator === '=' ? '===' : rollCase.condition.operator
  const val =
    typeof rollCase.condition.value === 'string'
      ? `'${rollCase.condition.value}'`
      : String(rollCase.condition.value)
  const accessor = optional
    ? `input?.${rollCase.condition.input}`
    : `input.${rollCase.condition.input}`
  return `${accessor} ${tsOp} ${val}`
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

function collectResults(rollDef: RollDefinition, spec: RandSumSpec): string[] {
  const defaultRanges = getOutcomeRanges(rollDef.outcome, spec)
  const whenRanges = (rollDef.when ?? []).flatMap(wc =>
    wc.override.outcome ? getOutcomeRanges(wc.override.outcome, spec) : []
  )
  return [...new Set([...defaultRanges, ...whenRanges].map(r => r.result))].sort()
}

function buildRangeReturn(range: TableRange, indent: string): string | null {
  const conditions: string[] = []
  const ret = `{ total, result: '${range.result}', rolls: r.rolls }`

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
    const val =
      typeof pc.countWhere.value === 'number'
        ? String(pc.countWhere.value)
        : pc.countWhere.value.$input
    const matchExpr = `${poolVar}.filter(v => v ${op} ${val}).length`

    if (pc.atLeast !== undefined) {
      const atLeast = typeof pc.atLeast === 'number' ? pc.atLeast : 0
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

function generateFunctionBody(
  rollDef: RollDefinition,
  spec: RandSumSpec,
  optional: boolean
): string[] {
  const lines: string[] = []

  for (const rollCase of rollDef.when ?? []) {
    const cond = conditionCode(rollCase, optional)
    const overrideDice = rollCase.override.dice ?? rollDef.dice
    const overrideMod = rollCase.override.modify ?? rollDef.modify ?? []
    const overrideOutcome = rollCase.override.outcome ?? rollDef.outcome
    const overrideRanges = getOutcomeRanges(overrideOutcome, spec)
    const diceCode = buildDiceOptionsCode(overrideDice, overrideMod, spec, rollDef.inputs, optional)
    const needsPre = overrideRanges.some(
      r => r.poolCondition !== undefined && r.poolCondition.pool !== 'postModify'
    )
    const needsPost = overrideRanges.some(r => r.poolCondition?.pool === 'postModify')

    lines.push(`  if (${cond}) {`)
    lines.push(`    const r = executeRoll(${diceCode})`)
    if (needsPre) lines.push(`    const preModify = r.rolls.flatMap(x => x.initialRolls)`)
    if (needsPost) lines.push(`    const postModify = r.rolls.flatMap(x => x.rolls)`)
    lines.push(`    const total = r.total`)
    for (const range of overrideRanges) {
      const check = buildRangeReturn(range, '    ')
      if (check) lines.push(check)
    }
    lines.push(`    throw new Error(\`No table match for total \${total}\`)`)
    lines.push(`  }`)
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

  lines.push(`  const r = executeRoll(${defaultDiceCode})`)
  if (needsPre) lines.push(`  const preModify = r.rolls.flatMap(x => x.initialRolls)`)
  if (needsPost) lines.push(`  const postModify = r.rolls.flatMap(x => x.rolls)`)
  lines.push(`  const total = r.total`)
  for (const range of defaultRanges) {
    const check = buildRangeReturn(range, '  ')
    if (check) lines.push(check)
  }
  lines.push(`  throw new Error(\`No table match for total \${total}\`)`)

  return lines
}

function generateRollParts(key: string, rollDef: RollDefinition, spec: RandSumSpec): string[] {
  const Key = capitalize(key)
  const results = collectResults(rollDef, spec)
  const optional = inputAllOptional(rollDef.inputs)
  const inputType = buildInputType(rollDef.inputs)
  const param = optional ? `input?: ${inputType}` : `input: ${inputType}`

  const parts: string[] = []
  const resultUnion = results.map(r => `'${r}'`).join(' | ')
  parts.push(`export type ${Key}Result = ${resultUnion}`)
  parts.push(``)
  parts.push(`export function ${key}(${param}): GameRollResult {`)
  parts.push(...generateFunctionBody(rollDef, spec, optional))
  parts.push(`}`)
  parts.push(``)

  return parts
}

function buildCodeString(spec: RandSumSpec): string {
  const patternKeys = Object.keys(spec).filter(k => /^roll[A-Z][a-zA-Z]*$/.test(k))
  const rollKeys = ['roll', ...patternKeys].filter(k => isRollDefinition(spec[k]))

  const parts: string[] = [
    `// Auto-generated from ${spec.name} spec. Run \`bun run codegen\` to regenerate.`,
    `// Do not edit this file manually.`,
    `import { executeRoll } from '@randsum/gameSchema'`,
    `import type { GameRollResult, RollRecord } from '@randsum/gameSchema'`,
    ``
  ]

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
