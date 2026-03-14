import { Box, Text } from 'ink'
import type { RollRecord } from '@randsum/roller/types'
import { computeSteps, formatAsMath } from '@randsum/display-utils'
import { useTerminalWidth } from '../hooks/useTerminalWidth'

const GOLD = '#c9a227'
const GOLD_BRIGHT = '#FFD700'

const TWO_COL_THRESHOLD = 80
const THREE_COL_THRESHOLD = 120

type TotalKind = 'none' | 'sub' | 'final'

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
    } else if (step.kind === 'finalRolls') {
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
