import React from 'react'
import { Box, Text } from 'ink'
import type { RollRecord } from '@randsum/roller'
import type { RollTraceStep } from '@randsum/roller/trace'
import { formatAsMath, traceRoll } from '@randsum/roller/trace'
import { DieBadge } from './DieBadge'

export interface StepRowProps {
  readonly step: RollTraceStep
}

export interface InkRollStepsProps {
  readonly record: RollRecord
  readonly showHeading?: boolean
}

function StepRow({ step }: StepRowProps): React.JSX.Element {
  if (step.kind === 'divider') {
    return (
      <Box>
        <Text dimColor>{'─'.repeat(20)}</Text>
      </Box>
    )
  }

  if (step.kind === 'arithmetic') {
    return (
      <Box flexDirection="row" gap={1}>
        <Text dimColor>{step.label}</Text>
        <Text color="yellow">{step.display}</Text>
      </Box>
    )
  }

  if (step.kind === 'rolls') {
    const replacements = step.replacements ?? []

    return (
      <Box flexDirection="row" gap={1}>
        <Text dimColor>{step.label}:</Text>
        <Box flexDirection="row" gap={1}>
          {replacements.length > 0 ? (
            <>
              {replacements.map((r, i) => (
                <Box key={`rp-${i}`} flexDirection="row">
                  <Text strikethrough color="red">
                    {r.from}
                  </Text>
                  <Text dimColor>{'→'}</Text>
                  <Text color="green">{r.to}</Text>
                </Box>
              ))}
              {step.unchanged.map((v, i) => (
                <DieBadge key={`u-${i}`} value={v} variant="unchanged" />
              ))}
            </>
          ) : (
            <>
              {step.removed.map((v, i) => (
                <DieBadge key={`r-${i}`} value={v} variant="removed" />
              ))}
              {step.added.map((v, i) => (
                <DieBadge key={`a-${i}`} value={v} variant="added" />
              ))}
              {step.unchanged.map((v, i) => (
                <DieBadge key={`u-${i}`} value={v} variant="unchanged" />
              ))}
            </>
          )}
        </Box>
      </Box>
    )
  }

  // finalRolls
  return (
    <Box flexDirection="row" gap={1}>
      <Text bold>Final:</Text>
      <Text color="cyan">{formatAsMath(step.rolls, step.arithmeticDelta)}</Text>
    </Box>
  )
}

export function RollSteps({ record, showHeading = false }: InkRollStepsProps): React.JSX.Element {
  const steps = traceRoll(record)

  return (
    <Box flexDirection="column">
      {showHeading && <Text bold>{record.notation}</Text>}
      {steps.map((step, i) => (
        <StepRow key={i} step={step} />
      ))}
    </Box>
  )
}
