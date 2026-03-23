import { useEffect } from 'react'
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'
import type { SupportedGameId } from '../lib/gameConfig'
import { GAME_INPUT_SPECS } from '../lib/gameInputSpecs'
import type { InputSpec } from '../lib/gameInputSpecs'

import { NumericStepper } from './NumericStepper'

interface GameRollerProps {
  readonly gameId: SupportedGameId
  readonly values: Record<string, unknown>
  readonly onChange: (name: string, value: unknown) => void
}

function IntegerInput({
  spec,
  value,
  onChange
}: {
  readonly spec: InputSpec
  readonly value: unknown
  readonly onChange: (v: number) => void
}): React.JSX.Element {
  const numValue = typeof value === 'number' ? value : ((spec.defaultValue as number) ?? 0)

  return (
    <NumericStepper
      value={numValue}
      min={spec.min ?? -99}
      max={spec.max ?? 99}
      onChange={onChange}
      label={spec.label}
    />
  )
}

function StringOptionsInput({
  spec,
  value,
  onChange
}: {
  readonly spec: InputSpec
  readonly value: unknown
  readonly onChange: (v: string | undefined) => void
}): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const selected = typeof value === 'string' ? value : undefined
  const options = spec.options ?? []

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: tokens.textMuted, fontSize: fontSizes.sm }]}>
        {spec.label}
      </Text>
      <View style={styles.segmentedRow}>
        {spec.optional === true ? (
          <Pressable
            onPress={() => onChange(undefined)}
            accessibilityRole="button"
            accessibilityLabel={`None for ${spec.label}`}
            accessibilityState={{ selected: selected === undefined }}
            style={[
              styles.segment,
              {
                backgroundColor: selected === undefined ? tokens.accent : tokens.surfaceAlt,
                borderRadius: 6
              }
            ]}
          >
            <Text
              style={{
                color: selected === undefined ? tokens.text : tokens.textMuted,
                fontSize: fontSizes.sm,
                fontWeight: '600'
              }}
            >
              None
            </Text>
          </Pressable>
        ) : null}
        {options.map(opt => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityLabel={`${opt} for ${spec.label}`}
            accessibilityState={{ selected: selected === opt }}
            style={[
              styles.segment,
              {
                backgroundColor: selected === opt ? tokens.accent : tokens.surfaceAlt,
                borderRadius: 6
              }
            ]}
          >
            <Text
              style={{
                color: selected === opt ? tokens.text : tokens.textMuted,
                fontSize: fontSizes.sm,
                fontWeight: '600'
              }}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function StringFreeInput({
  spec,
  value,
  onChange
}: {
  readonly spec: InputSpec
  readonly value: unknown
  readonly onChange: (v: string) => void
}): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const strValue = typeof value === 'string' ? value : ''

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: tokens.textMuted, fontSize: fontSizes.sm }]}>
        {spec.label}
      </Text>
      <TextInput
        value={strValue}
        onChangeText={onChange}
        placeholder={spec.label}
        placeholderTextColor={tokens.textDim}
        accessibilityLabel={spec.label}
        style={[
          styles.textInput,
          {
            color: tokens.text,
            backgroundColor: tokens.surfaceAlt,
            fontSize: fontSizes.base,
            borderRadius: 8
          }
        ]}
      />
    </View>
  )
}

function BooleanInput({
  spec,
  value,
  onChange
}: {
  readonly spec: InputSpec
  readonly value: unknown
  readonly onChange: (v: boolean) => void
}): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const boolValue = typeof value === 'boolean' ? value : ((spec.defaultValue as boolean) ?? false)

  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.switchRow}>
        <Text style={[styles.fieldLabel, { color: tokens.textMuted, fontSize: fontSizes.sm }]}>
          {spec.label}
        </Text>
        <Switch
          value={boolValue}
          onValueChange={onChange}
          trackColor={{ false: tokens.surfaceAlt, true: tokens.accent }}
          accessibilityLabel={spec.label}
        />
      </View>
    </View>
  )
}

export function GameRoller({ gameId, values, onChange }: GameRollerProps): React.JSX.Element {
  const specs = GAME_INPUT_SPECS[gameId]

  // Reset input state when gameId changes
  useEffect(() => {
    // Initialize defaults when switching games
    for (const spec of specs) {
      if (values[spec.name] === undefined && spec.defaultValue !== undefined) {
        onChange(spec.name, spec.defaultValue)
      }
    }
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      {specs.map(spec => {
        switch (spec.kind) {
          case 'integer':
            return (
              <IntegerInput
                key={spec.name}
                spec={spec}
                value={values[spec.name]}
                onChange={v => onChange(spec.name, v)}
              />
            )
          case 'string-options':
            return (
              <StringOptionsInput
                key={spec.name}
                spec={spec}
                value={values[spec.name]}
                onChange={v => onChange(spec.name, v)}
              />
            )
          case 'string-free':
            return (
              <StringFreeInput
                key={spec.name}
                spec={spec}
                value={values[spec.name]}
                onChange={v => onChange(spec.name, v)}
              />
            )
          case 'boolean':
            return (
              <BooleanInput
                key={spec.name}
                spec={spec}
                value={values[spec.name]}
                onChange={v => onChange(spec.name, v)}
              />
            )
        }
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  fieldWrapper: {
    gap: 4
  },
  fieldLabel: {
    marginLeft: 4
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44
  }
})
