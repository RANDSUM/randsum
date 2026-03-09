import { Box, Text } from 'ink'
import type { RollRecord } from '@randsum/roller'
import { useTerminalWidth } from '../hooks/useTerminalWidth'

const GOLD = '#c9a227'
const GOLD_BRIGHT = '#FFD700'

const TWO_COL_THRESHOLD = 80
const THREE_COL_THRESHOLD = 120

const ARITHMETIC_MODIFIERS: Partial<Record<string, { label: string; sign: string }>> = {
  plus: { label: 'Add', sign: '+' },
  minus: { label: 'Subtract', sign: '-' },
  multiply: { label: 'Multiply', sign: '*' },
  multiplyTotal: { label: 'Multiply total', sign: '*' }
}

type TotalKind = 'none' | 'sub' | 'final'

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

function rowBg(rowIdx: number): string | undefined {
  if (rowIdx === 0) return '#2a3232'
  return rowIdx % 2 === 1 ? '#262626' : undefined
}

function StepRow({
  rowIdx,
  totalKind,
  label,
  right
}: {
  readonly rowIdx: number
  readonly totalKind: TotalKind
  readonly label: React.ReactNode
  readonly right: React.ReactNode
}): React.JSX.Element {
  const bg = rowBg(rowIdx)
  const borderColor = totalKind === 'final' ? GOLD_BRIGHT : totalKind === 'sub' ? GOLD : 'cyan'
  const borderTop = totalKind === 'final'
  const borderBottom = totalKind !== 'none'
  return (
    <Box
      borderStyle="single"
      borderTop={borderTop}
      borderBottom={borderBottom}
      borderColor={borderColor}
      paddingX={1}
      justifyContent="space-between"
      {...(bg !== undefined ? { backgroundColor: bg } : {})}
    >
      {label}
      {right}
    </Box>
  )
}

function RecordPanel({
  record,
  showLabel,
  isSubPanel,
  omitTotal = false
}: {
  readonly record: RollRecord
  readonly showLabel: boolean
  readonly isSubPanel: boolean
  readonly omitTotal?: boolean
}): React.JSX.Element {
  const steps = computeSteps(record)
  const hasModifiers = steps.length > 1
  const rows: React.JSX.Element[] = []
  const totalKind: TotalKind = isSubPanel ? 'sub' : 'final'

  if (showLabel) {
    const bg = rowBg(rows.length)
    rows.push(
      <Box
        key="notation-label"
        borderStyle="single"
        borderTop={true}
        borderColor={GOLD}
        paddingX={1}
        {...(bg !== undefined ? { backgroundColor: bg } : {})}
      >
        <Text bold color="cyan">
          {record.notation}
        </Text>
      </Box>
    )
  }

  steps.forEach((step, j) => {
    if (step.kind === 'arithmetic') {
      rows.push(
        <StepRow
          key={j}
          rowIdx={rows.length}
          totalKind="none"
          label={<Text dimColor>{step.label}</Text>}
          right={<Text color="yellow">{step.display}</Text>}
        />
      )
    } else if (step.kind === 'rolls') {
      const numbers = (
        <Box gap={1}>
          {step.removed.length > 0 && (
            <Text strikethrough color="red">
              {step.removed.join(', ')}
            </Text>
          )}
          {step.added.length > 0 && <Text color="blue">{step.added.join(', ')}</Text>}
          {(step.removed.length > 0 || step.added.length > 0) && step.unchanged.length > 0 && (
            <Text dimColor>|</Text>
          )}
          {step.unchanged.length > 0 && <Text>{step.unchanged.join(', ')}</Text>}
        </Box>
      )
      rows.push(
        <StepRow
          key={j}
          rowIdx={rows.length}
          totalKind="none"
          label={<Text dimColor>{step.label}</Text>}
          right={numbers}
        />
      )
    } else {
      rows.push(
        <StepRow
          key={`${j}f`}
          rowIdx={rows.length}
          totalKind="none"
          label={<Text dimColor>Final</Text>}
          right={<Text>{formatAsMath(step.rolls, step.arithmeticDelta)}</Text>}
        />
      )

      if (!omitTotal) {
        rows.push(
          <StepRow
            key={`${j}t`}
            rowIdx={rows.length}
            totalKind={totalKind}
            label={
              <Text bold={!isSubPanel} color={GOLD_BRIGHT}>
                Total
              </Text>
            }
            right={
              <Text bold={!isSubPanel} color="cyan">
                {record.appliedTotal}
              </Text>
            }
          />
        )
      }
    }
  })

  if (!hasModifiers && !omitTotal) {
    rows.push(
      <StepRow
        key="total"
        rowIdx={rows.length}
        totalKind={totalKind}
        label={
          <Text bold={!isSubPanel} color={GOLD_BRIGHT}>
            Total
          </Text>
        }
        right={
          <Text bold={!isSubPanel} color="cyan">
            {record.total}
          </Text>
        }
      />
    )
  }

  return <Box flexDirection="column">{rows}</Box>
}

export function RollResultPanel({
  records,
  notation
}: {
  readonly records: readonly RollRecord[]
  readonly notation: string
}): React.JSX.Element {
  const multiPool = records.length > 1
  const termWidth = useTerminalWidth()
  const cols = !multiPool
    ? 1
    : termWidth >= THREE_COL_THRESHOLD
      ? 3
      : termWidth >= TWO_COL_THRESHOLD
        ? 2
        : 1
  const colWidth = cols === 3 ? '33%' : '50%'

  const externalTotal = multiPool
    ? records.reduce((sum, r) => sum + r.appliedTotal, 0)
    : (records[0]?.appliedTotal ?? 0)

  const poolsOnly =
    cols > 1 ? (
      (() => {
        const groups = Array.from({ length: Math.ceil(records.length / cols) }, (_, gi) =>
          records.slice(gi * cols, gi * cols + cols)
        )
        return (
          <>
            {groups.map((group, gi) => (
              <Box key={gi} flexDirection="row">
                {group.map((record, ci) => (
                  <Box key={ci} width={colWidth} flexDirection="column">
                    <RecordPanel
                      record={record}
                      showLabel={true}
                      isSubPanel={true}
                      omitTotal={false}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </>
        )
      })()
    ) : (
      <>
        {records.map((record, i) => (
          <RecordPanel
            key={i}
            record={record}
            showLabel={multiPool}
            isSubPanel={multiPool}
            omitTotal={!multiPool}
          />
        ))}
      </>
    )

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor={GOLD} paddingX={1} justifyContent="center">
        <Text bold color="cyan">
          {notation}
        </Text>
      </Box>
      {poolsOnly}
      <StepRow
        rowIdx={0}
        totalKind="final"
        label={
          <Text bold color={GOLD_BRIGHT}>
            Total
          </Text>
        }
        right={
          <Text bold color="cyan">
            {externalTotal}
          </Text>
        }
      />
    </Box>
  )
}
