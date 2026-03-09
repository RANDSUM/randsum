import { Box, Text } from 'ink'
import type { RollRecord } from '@randsum/roller'

const ARITHMETIC_MODIFIERS: Partial<Record<string, { label: string; sign: string }>> = {
  plus: { label: 'Add', sign: '+' },
  minus: { label: 'Subtract', sign: '-' },
  multiply: { label: 'Multiply', sign: '*' },
  multiplyTotal: { label: 'Multiply total', sign: '*' }
}

type TooltipStep =
  | {
      kind: 'rolls'
      label: string
      unchanged: readonly number[]
      removed: readonly number[]
      added: readonly number[]
    }
  | { kind: 'arithmetic'; label: string; display: string }
  | { kind: 'finalRolls'; rolls: readonly number[]; arithmeticDelta: number }

function numVal(opts: Record<string, unknown>, key: string): number | undefined {
  const v = opts[key]
  return typeof v === 'number' ? v : undefined
}

function modifierLabel(modifier: string, options: unknown): string {
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
    const gt = numVal(opts, 'greaterThan')
    if (gt !== undefined) return `${base} >${gt}`
    const gte = numVal(opts, 'greaterThanOrEqual')
    if (gte !== undefined) return `${base} >=${gte}`
    const lt = numVal(opts, 'lessThan')
    if (lt !== undefined) return `${base} <${lt}`
    const lte = numVal(opts, 'lessThanOrEqual')
    if (lte !== undefined) return `${base} <=${lte}`
    const exact = numVal(opts, 'exact')
    if (exact !== undefined) return `${base} ${exact}`
  }
  return base
}

function applyRemove(pool: readonly number[], values: readonly number[]): number[] {
  const result = [...pool]
  for (const val of values) {
    const idx = result.indexOf(val)
    if (idx !== -1) result.splice(idx, 1)
  }
  return result
}

function formatAsMath(rolls: readonly number[], delta = 0): string {
  const terms = rolls.map((n, i) => {
    if (i === 0) return String(n)
    return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`
  })
  if (delta > 0) terms.push(`+ ${delta}`)
  if (delta < 0) terms.push(`- ${Math.abs(delta)}`)
  return terms.join(' ')
}

function computeSteps(record: RollRecord): readonly TooltipStep[] {
  const steps: TooltipStep[] = []
  const current: number[] = [...record.modifierHistory.initialRolls]

  steps.push({ kind: 'rolls', label: 'Rolled', unchanged: [...current], removed: [], added: [] })

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
      (log.modifier === 'drop' || log.modifier === 'keep') && typeof log.options === 'object'

    if (isSplittable) {
      const opts = log.options as Record<string, unknown>
      const lowest = numVal(opts, 'lowest')
      const highest = numVal(opts, 'highest')
      const base = log.modifier.charAt(0).toUpperCase() + log.modifier.slice(1)

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
    modifierSteps.push({ kind: 'rolls', label, unchanged, removed: log.removed, added: log.added })
  }

  if (modifierSteps.length > 0) {
    steps.push(...modifierSteps)
    const arithmeticDelta = record.appliedTotal - record.modifierHistory.total
    steps.push({ kind: 'finalRolls', rolls: record.modifierHistory.modifiedRolls, arithmeticDelta })
  }
  return steps
}

function DiceRow({
  label,
  unchanged,
  removed,
  added
}: {
  readonly label: string
  readonly unchanged: readonly number[]
  readonly removed: readonly number[]
  readonly added: readonly number[]
}): React.JSX.Element {
  return (
    <Box gap={1}>
      <Text dimColor>{label.padEnd(16)}</Text>
      {removed.length > 0 && (
        <Text strikethrough color="red">
          {removed.join(', ')}
        </Text>
      )}
      {added.length > 0 && <Text color="green">{added.join(', ')}</Text>}
      {(removed.length > 0 || added.length > 0) && unchanged.length > 0 && <Text dimColor>|</Text>}
      {unchanged.length > 0 && <Text>{unchanged.join(', ')}</Text>}
    </Box>
  )
}

export function RollResultPanel({
  records
}: {
  readonly records: readonly RollRecord[]
}): React.JSX.Element {
  const multiPool = records.length > 1

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
      <Text bold dimColor>
        Result Breakdown
      </Text>
      {records.map((record, i) => {
        const steps = computeSteps(record)
        const hasModifiers = steps.length > 1
        return (
          <Box key={i} flexDirection="column">
            {multiPool && (
              <Text bold color="cyan">
                {record.notation}
              </Text>
            )}
            {steps.map((step, j) => {
              if (step.kind === 'arithmetic') {
                return (
                  <Box key={j} gap={1}>
                    <Text dimColor>{step.label.padEnd(16)}</Text>
                    <Text color="yellow">{step.display}</Text>
                  </Box>
                )
              }
              if (step.kind === 'rolls') {
                return (
                  <DiceRow
                    key={j}
                    label={step.label}
                    unchanged={step.unchanged}
                    removed={step.removed}
                    added={step.added}
                  />
                )
              }
              return (
                <Box key={j} gap={1}>
                  <Text dimColor>{'Final'.padEnd(16)}</Text>
                  <Text bold>{formatAsMath(step.rolls, step.arithmeticDelta)}</Text>
                </Box>
              )
            })}
            {!hasModifiers && (
              <Box gap={1}>
                <Text dimColor>{'Total'.padEnd(16)}</Text>
                <Text bold>{record.total}</Text>
              </Box>
            )}
            {multiPool && i < records.length - 1 && <Text dimColor>{'─'.repeat(20)}</Text>}
          </Box>
        )
      })}
    </Box>
  )
}
