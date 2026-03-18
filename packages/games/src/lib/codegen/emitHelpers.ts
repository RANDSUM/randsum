import { SchemaError } from '../errors'
import type {
  NormalizedDiceConfig,
  NormalizedOutcome,
  NormalizedRollCase,
  NormalizedRollDefinition,
  NormalizedSpec
} from '../normalizedTypes'
import type {
  Condition,
  InputDeclaration,
  IntegerOrInput,
  PostResolveModifyOperation,
  TableRange
} from '../types'

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toPascalCase(str: string): string {
  return str.split('-').map(capitalize).join('')
}

export function specToFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function toDiceConfig(
  dice: NormalizedDiceConfig | readonly NormalizedDiceConfig[]
): NormalizedDiceConfig {
  if ('pool' in dice) return dice
  const [first] = dice
  if (first === undefined) throw new SchemaError('dice array is empty', 'INVALID_SPEC')
  return first
}

export function inputAllOptional(inputs: NormalizedRollDefinition['inputs']): boolean {
  if (!inputs || Object.keys(inputs).length === 0) return true
  return Object.values(inputs).every(isInputOptional)
}

export function integerOrInputCode(
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

export function inputTsType(decl: InputDeclaration): string {
  if (decl.type === 'integer') return 'number'
  if (decl.type === 'boolean') return 'boolean'
  if (decl.enum !== undefined && decl.enum.length > 0) {
    return decl.enum.map(v => `'${v}'`).join(' | ')
  }
  return 'string'
}

export function isInputOptional(decl: InputDeclaration): boolean {
  return decl.default !== undefined || decl.optional === true
}

export function buildInputType(inputs: NormalizedRollDefinition['inputs']): string {
  if (!inputs || Object.keys(inputs).length === 0) return 'Record<string, never>'
  const fields = Object.entries(inputs).map(([name, decl]: [string, InputDeclaration]) => {
    const tsType = inputTsType(decl)
    const opt = isInputOptional(decl) ? '?' : ''
    return `${name}${opt}: ${tsType}`
  })
  return `{ ${fields.join('; ')} }`
}

export function conditionCodeFromCondition(condition: Condition, optional: boolean): string {
  const tsOp = condition.operator === '=' ? '===' : condition.operator
  const val = typeof condition.value === 'string' ? `'${condition.value}'` : String(condition.value)
  const accessor = optional ? `input?.${condition.input}` : `input.${condition.input}`
  return `${accessor} ${tsOp} ${val}`
}

export function conditionCode(rollCase: NormalizedRollCase, optional: boolean): string {
  return conditionCodeFromCondition(rollCase.condition, optional)
}

export function getOutcomeRanges(outcome: NormalizedOutcome | undefined): readonly TableRange[] {
  if (!outcome) return []
  if ('ranges' in outcome) return outcome.ranges
  if ('tableLookup' in outcome) return outcome.tableLookup.ranges
  return []
}

export function getResultStrings(outcome: NormalizedOutcome | undefined): string[] {
  if (outcome === undefined) return []
  if ('degreeOfSuccess' in outcome) {
    return Object.keys(outcome.degreeOfSuccess)
  }
  return getOutcomeRanges(outcome).map(r => r.result)
}

export function hasEffectivePostResolveModifiers(
  postResolveModifiers: NormalizedRollDefinition['postResolveModifiers']
): boolean {
  if (!postResolveModifiers || postResolveModifiers.length === 0) return false
  return postResolveModifiers.some(op => op.add !== undefined)
}

export function buildPostResolveTotalExpr(
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

export type CollectedResults =
  | { readonly kind: 'union'; readonly values: readonly string[] }
  | { readonly kind: 'numeric' }
  | { readonly kind: 'opaque' }
  | { readonly kind: 'result-mapping' }

export function collectResults(rollDef: NormalizedRollDefinition): CollectedResults {
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

export interface SingleInputOverload {
  readonly fieldName: string
  readonly tsType: string
  readonly baseType: 'number' | 'string' | 'boolean'
  readonly fieldOptional: boolean
}

export function getSingleInputOverload(
  rollDef: NormalizedRollDefinition
): SingleInputOverload | null {
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

export function needsValidationImports(nspec: NormalizedSpec): {
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

export function generateValidationLines(
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
        `${indent}if (${guard}![${enumValues}].includes(${accessor} as string)) throw new SchemaError(\`Invalid ${fieldName} value: \${String(${accessor})}. Must be ${enumList}.\`, 'INVALID_INPUT_TYPE')`
      )
    }
  }
  return lines
}
