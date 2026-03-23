import type { RollRecord } from '@randsum/roller'
import type { RollTraceStep } from '@randsum/roller/trace'
import { formatAsMath, traceRoll } from '@randsum/roller/trace'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from './useTheme'

export interface DieBadgeProps {
  readonly value: number
  readonly variant: 'unchanged' | 'removed' | 'added'
}

export interface StepRowProps {
  readonly step: RollTraceStep
}

export interface RollStepsProps {
  readonly record: RollRecord
  readonly showHeading?: boolean
}

const TOKENS = {
  dark: {
    text: '#fafafa',
    textMuted: '#a1a1aa',
    textDim: '#71717a',
    surface: '#18181b',
    surfaceAlt: '#27272a',
    border: '#3f3f46',
    accent: '#a855f7'
  },
  light: {
    text: '#18181b',
    textMuted: '#3f3f46',
    textDim: '#71717a',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    border: '#a1a1aa',
    accent: '#9333ea'
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 4
  },
  heading: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    marginBottom: 4
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4
  },
  stepLabel: {
    fontSize: 12,
    marginRight: 4
  },
  dieBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  dieBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dieBadgeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  divider: {
    height: 1,
    marginVertical: 4
  },
  arithmetic: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  finalMath: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  replacementPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  arrow: {
    fontSize: 12,
    marginHorizontal: 2
  }
})

export function DieBadge({ value, variant }: DieBadgeProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  const badgeStyle = {
    backgroundColor: tokens.surfaceAlt,
    ...(variant === 'removed' ? { opacity: 0.4 } : {})
  }

  const textStyle = {
    color: variant === 'added' ? tokens.accent : tokens.text,
    textDecorationLine: variant === 'removed' ? ('line-through' as const) : ('none' as const)
  }

  return (
    <View style={[styles.dieBadge, badgeStyle]}>
      <Text style={[styles.dieBadgeText, textStyle]}>{value}</Text>
    </View>
  )
}

function ReplacementPair({
  from,
  to,
  index
}: {
  readonly from: number
  readonly to: number
  readonly index: number
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  return (
    <View key={`rp-${index}`} style={styles.replacementPair}>
      <DieBadge value={from} variant="removed" />
      <Text style={[styles.arrow, { color: tokens.textDim }]}>{'\u2192'}</Text>
      <DieBadge value={to} variant="added" />
    </View>
  )
}

export function StepRow({ step }: StepRowProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  if (step.kind === 'divider') {
    return <View style={[styles.divider, { backgroundColor: tokens.border }]} />
  }

  if (step.kind === 'arithmetic') {
    return (
      <View style={styles.stepRow}>
        <Text style={[styles.stepLabel, { color: tokens.textMuted }]}>{step.label}</Text>
        <Text style={[styles.arithmetic, { color: tokens.text }]}>{step.display}</Text>
      </View>
    )
  }

  if (step.kind === 'rolls') {
    const replacements = step.replacements ?? []

    return (
      <View style={styles.stepRow}>
        <Text style={[styles.stepLabel, { color: tokens.textMuted }]}>{step.label}</Text>
        <View style={styles.dieBadges}>
          {replacements.length > 0 ? (
            <>
              {replacements.map((r, i) => (
                <ReplacementPair key={`rp-${i}`} from={r.from} to={r.to} index={i} />
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
        </View>
      </View>
    )
  }

  // finalRolls
  return (
    <View style={styles.stepRow}>
      <Text style={[styles.stepLabel, { color: tokens.textMuted }]}>Final</Text>
      <Text style={[styles.finalMath, { color: tokens.text }]}>
        {formatAsMath(step.rolls, step.arithmeticDelta)}
      </Text>
    </View>
  )
}

export function RollSteps({ record, showHeading = false }: RollStepsProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const steps = traceRoll(record)

  return (
    <View style={styles.container}>
      {showHeading && (
        <Text style={[styles.heading, { color: tokens.textMuted }]}>{record.notation}</Text>
      )}
      {steps.map((step, i) => (
        <StepRow key={i} step={step} />
      ))}
    </View>
  )
}
