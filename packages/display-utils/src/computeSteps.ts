import type { RollRecord } from '@randsum/roller'

export type TooltipStep =
  | {
      kind: 'rolls'
      label: string
      unchanged: readonly number[]
      removed: readonly number[]
      added: readonly number[]
    }
  | { kind: 'divider' }
  | { kind: 'arithmetic'; label: string; display: string }
  | { kind: 'finalRolls'; rolls: readonly number[]; arithmeticDelta: number }

export const ARITHMETIC_MODIFIERS: Partial<
  Record<string, { label: string; sign: string }>
> = {
  plus: { label: 'Add', sign: '+' },
  minus: { label: 'Subtract', sign: '-' },
  multiply: { label: 'Multiply', sign: '\u00d7' },
  multiplyTotal: { label: 'Multiply total', sign: '\u00d7' }
}

export function numVal(
  opts: Record<string, unknown>,
  key: string
): number | undefined {
  const v = opts[key]
  return typeof v === 'number' ? v : undefined
}

export function formatComparison(opts: Record<string, unknown>): string {
  const parts: string[] = []
  const gt = numVal(opts, 'greaterThan')
  if (gt !== undefined) parts.push(`Greater than ${gt}`)
  const gte = numVal(opts, 'greaterThanOrEqual')
  if (gte !== undefined) parts.push(`At least ${gte}`)
  const lt = numVal(opts, 'lessThan')
  if (lt !== undefined) parts.push(`Less than ${lt}`)
  const lte = numVal(opts, 'lessThanOrEqual')
  if (lte !== undefined) parts.push(`At most ${lte}`)
  const exact = numVal(opts, 'exact')
  if (exact !== undefined) parts.push(`${exact}`)
  return parts.join(', ')
}

export function modifierLabel(modifier: string, options: unknown): string {
  const base = modifier.charAt(0).toUpperCase() + modifier.slice(1)
  if (options !== null && typeof options === 'object') {
    const opts = options as Record<string, unknown>
    if (modifier === 'drop' || modifier === 'keep') {
      const lowest = numVal(opts, 'lowest')
      const highest = numVal(opts, 'highest')
      const parts: string[] = []
      if (lowest !== undefined) parts.push(`Lowest ${lowest}`)
      if (highest !== undefined) parts.push(`Highest ${highest}`)
      if (parts.length > 0) return `${base} ${parts.join(', ')}`
    }
    const comparison = formatComparison(opts)
    if (comparison) return `${base} ${comparison}`
  }
  return base
}

export function formatAsMath(
  rolls: readonly number[],
  delta = 0
): string {
  const terms = rolls.map((n, i) => {
    if (i === 0) return String(n)
    return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`
  })
  if (delta > 0) terms.push(`+ ${delta}`)
  if (delta < 0) terms.push(`- ${Math.abs(delta)}`)
  return terms.join(' ')
}

export function applyRemove(
  pool: readonly number[],
  values: readonly number[]
): number[] {
  const result = [...pool]
  for (const val of values) {
    const idx = result.indexOf(val)
    if (idx !== -1) result.splice(idx, 1)
  }
  return result
}

export function computeSteps(
  record: RollRecord
): readonly TooltipStep[] {
  const steps: TooltipStep[] = []
  const current: number[] = [...record.modifierHistory.initialRolls]

  steps.push({
    kind: 'rolls',
    label: 'Rolled',
    unchanged: [...current],
    removed: [],
    added: []
  })

  const modifierSteps: TooltipStep[] = []

  for (const log of record.modifierHistory.logs) {
    const arith = ARITHMETIC_MODIFIERS[log.modifier]
    if (arith) {
      const value = log.options as number
      modifierSteps.push({
        kind: 'arithmetic',
        label: arith.label,
        display: `${arith.sign}${value}`
      })
      continue
    }

    const isSplittable =
      (log.modifier === 'drop' || log.modifier === 'keep') &&
      typeof log.options === 'object'

    if (isSplittable) {
      const opts = log.options as Record<string, unknown>
      const lowest = numVal(opts, 'lowest')
      const highest = numVal(opts, 'highest')
      const base =
        log.modifier.charAt(0).toUpperCase() + log.modifier.slice(1)

      if (lowest !== undefined && highest !== undefined) {
        const sortedAsc = [...current].sort((a, b) => a - b)
        const lowestRemoved = sortedAsc.slice(0, lowest)
        const afterLowest = applyRemove(current, lowestRemoved)

        const sortedDesc = [...afterLowest].sort((a, b) => b - a)
        const highestRemoved = sortedDesc.slice(0, highest)
        const afterHighest = applyRemove(afterLowest, highestRemoved)

        modifierSteps.push({
          kind: 'rolls',
          label: `${base} Lowest ${lowest}`,
          unchanged: afterLowest,
          removed: lowestRemoved,
          added: []
        })
        modifierSteps.push({
          kind: 'rolls',
          label: `${base} Highest ${highest}`,
          unchanged: afterHighest,
          removed: highestRemoved,
          added: []
        })

        current.length = 0
        current.push(...afterHighest)
        continue
      }
    }

    for (const val of log.removed) {
      const idx = current.indexOf(val)
      if (idx !== -1) current.splice(idx, 1)
    }
    current.push(...log.added)

    const unchanged = [...current]
    for (const val of log.added) {
      const idx = unchanged.indexOf(val)
      if (idx !== -1) unchanged.splice(idx, 1)
    }

    const label = modifierLabel(log.modifier, log.options)
    modifierSteps.push({
      kind: 'rolls',
      label,
      unchanged,
      removed: log.removed,
      added: log.added
    })
  }

  if (modifierSteps.length > 0) {
    steps.push(...modifierSteps)
    const arithmeticDelta =
      record.appliedTotal - record.modifierHistory.total
    steps.push({
      kind: 'finalRolls',
      rolls: record.modifierHistory.modifiedRolls,
      arithmeticDelta
    })
  }
  return steps
}
