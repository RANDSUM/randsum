import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StepRow } from './RollSteps'
import { useTheme } from './useTheme'

export interface RollResultPanelProps {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
  readonly onClose?: () => void
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
    gap: 8
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  closeText: {
    fontSize: 18,
    lineHeight: 20
  },
  totalPane: {
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  totalValue: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 32,
    fontWeight: 'bold'
  },
  rows: {
    gap: 4
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4
  },
  headerNotation: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    fontWeight: 'bold'
  },
  headerSep: {
    fontSize: 13
  },
  headerDesc: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  poolHeading: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  totalLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    fontWeight: 'bold'
  },
  totalMath: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  }
})

export function RollResultPanel({
  total,
  records,
  notation,
  onClose
}: RollResultPanelProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  return (
    <View style={styles.container}>
      {onClose !== undefined && (
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeText, { color: tokens.textMuted }]}>{'×'}</Text>
        </Pressable>
      )}
      <View style={[styles.totalPane, { borderColor: tokens.accent }]}>
        <Text style={[styles.totalValue, { color: tokens.accent }]}>{total}</Text>
      </View>
      <RollResultDisplay records={records} total={total} notation={notation} />
    </View>
  )
}

export function RollResultDisplay({
  records,
  total,
  notation
}: {
  readonly records: readonly RollRecord[]
  readonly total?: number
  readonly notation?: string
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const multiPool = records.length > 1

  const steps = records.flatMap((record, i) => {
    const rows: React.JSX.Element[] = []
    if (multiPool) {
      rows.push(
        <Text key={`heading-${i}`} style={[styles.poolHeading, { color: tokens.accent }]}>
          {record.notation}
        </Text>
      )
    }
    const traced = traceRoll(record)
    traced.forEach((step, j) => {
      rows.push(<StepRow key={`step-${i}-${j}`} step={step} />)
    })
    return rows
  })

  return (
    <View style={styles.rows}>
      {notation !== undefined && (
        <View style={styles.headerLine}>
          <Text style={[styles.headerNotation, { color: tokens.accent }]}>{notation}</Text>
          <Text style={[styles.headerSep, { color: tokens.textDim }]}>{'|'}</Text>
          <Text style={[styles.headerDesc, { color: tokens.textMuted }]}>
            {records.map(r => r.description.join(', ')).join(' + ')}
          </Text>
        </View>
      )}
      {steps}
      {total !== undefined && (
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: tokens.text }]}>{'Total'}</Text>
          <Text style={[styles.totalMath, { color: tokens.text }]}>
            {records.length > 1
              ? records
                  .map((r, i) => {
                    const poolTotal =
                      r.rolls.length > 0 ? `[${r.rolls.join('+')}]` : `${r.appliedTotal}`
                    const prefix = i === 0 ? '' : r.appliedTotal < 0 ? ' - ' : ' + '
                    return `${prefix}${r.appliedTotal < 0 && i > 0 ? poolTotal.replace('-', '') : poolTotal}`
                  })
                  .join('') + ` = ${total}`
              : total}
          </Text>
        </View>
      )}
    </View>
  )
}
