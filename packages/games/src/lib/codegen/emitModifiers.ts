import type { NormalizedDiceConfig, NormalizedRollDefinition } from '../normalizedTypes'
import type { InputDeclaration, IntegerOrInput, ModifyOperation } from '../types'
import { integerOrInputCode, toDiceConfig } from './emitHelpers'

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

export function buildDiceOptionsCode(
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
