import type { ComparisonOptions, ModifierOptions } from '@randsum/roller'

import { bindInteger } from './inputBinder'
import type { ModifyOperation, RollInput } from './types'

export interface MarkDiceOp {
  readonly type: 'markDice'
  readonly operator: string
  readonly value: number
  readonly flag: string
}

export interface KeepMarkedOp {
  readonly type: 'keepMarked'
  readonly flag: string
}

export type ManualOp = MarkDiceOp | KeepMarkedOp

export interface TranslationResult {
  readonly rollerOptions: ModifierOptions
  readonly manualOps: readonly ManualOp[]
}

export function translateModifiers(
  modify: readonly ModifyOperation[],
  input: RollInput
): TranslationResult {
  const rollerOptions: ModifierOptions = {}
  const manualOps: ManualOp[] = []

  for (const op of modify) {
    if (op.keepHighest !== undefined) {
      rollerOptions.keep = { highest: bindInteger(op.keepHighest, input) }
    }
    if (op.keepLowest !== undefined) {
      rollerOptions.keep = { lowest: bindInteger(op.keepLowest, input) }
    }
    if (op.add !== undefined) {
      rollerOptions.plus = bindInteger(op.add, input)
    }
    if (op.cap !== undefined) {
      const capOptions: ComparisonOptions = {}
      if (op.cap.max !== undefined) {
        capOptions.greaterThan = bindInteger(op.cap.max, input)
      }
      if (op.cap.min !== undefined) {
        capOptions.lessThan = bindInteger(op.cap.min, input)
      }
      rollerOptions.cap = capOptions
    }
    if (op.markDice !== undefined) {
      manualOps.push({
        type: 'markDice',
        operator: op.markDice.operator,
        value: bindInteger(op.markDice.value, input),
        flag: op.markDice.flag
      })
    }
    if (op.keepMarked !== undefined) {
      manualOps.push({ type: 'keepMarked', flag: op.keepMarked })
    }
  }

  return { rollerOptions, manualOps }
}
