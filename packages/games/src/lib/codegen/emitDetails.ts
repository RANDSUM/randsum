import type {
  NormalizedDetailsFieldDef,
  NormalizedDetailsLeafDef,
  NormalizedRollDefinition
} from '../normalizedTypes'

export function normalizedLeafTsType(
  leaf: NormalizedDetailsLeafDef,
  inputs: NormalizedRollDefinition['inputs']
): string {
  if ('expr' in leaf) return 'number'
  if ('$pool' in leaf) return 'number'
  if ('$conditionalPool' in leaf) return 'number'
  if ('$dieCheck' in leaf) return 'boolean'
  // $input — look up the input declaration
  const decl = inputs?.[leaf.$input]
  return decl?.type === 'integer' ? 'number' : decl?.type === 'boolean' ? 'boolean' : 'string'
}

export function emitDetailsInterface(
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
  if ('$dieCheck' in leaf) {
    const dc = leaf.$dieCheck
    const rollsField = dc.field === 'final' ? 'rolls' : 'initialRolls'
    const opMap: Record<string, string> = {
      '=': '===',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<='
    }
    const op = opMap[dc.operator] ?? '==='
    return `(r.rolls[${dc.pool}]?.${rollsField}[${dc.die}] ${op} ${dc.value})`
  }
  const accessor = optional ? `input?.${leaf.$input}` : `input.${leaf.$input}`
  if (leaf.default !== undefined) {
    return `${accessor} ?? ${typeof leaf.default === 'string' ? `'${leaf.default}'` : String(leaf.default)}`
  }
  return accessor
}

export function emitDetailsObjectCode(
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

export function detailsNeedsDiceTotal(
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

export function detailsNeedsConditionalPool(
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
