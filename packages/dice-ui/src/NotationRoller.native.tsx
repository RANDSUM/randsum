import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { tokenize } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { TokenOverlayInput } from './TokenOverlayInput'
import { useTheme } from './useTheme'
import { tokenColor } from './tokenColor'
import type { RollResult } from './types'

export type { RollResult }

export interface NotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
  readonly onRoll?: (result: RollResult) => void
}

const TOKENS = {
  dark: {
    text: '#fafafa',
    textMuted: '#a1a1aa',
    textDim: '#71717a',
    surface: '#18181b',
    surfaceAlt: '#27272a',
    border: '#3f3f46',
    accent: '#a855f7',
    error: '#f97583'
  },
  light: {
    text: '#18181b',
    textMuted: '#3f3f46',
    textDim: '#71717a',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    border: '#a1a1aa',
    accent: '#9333ea',
    error: '#f97583'
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden'
  },
  rollButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rollButtonText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  descRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 20,
    paddingHorizontal: 2
  },
  descText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  descSep: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  }
})

export function NotationRoller({
  defaultNotation = '4d6L',
  notation: controlledNotation,
  onChange,
  resetToken,
  onRoll
}: NotationRollerProps = {}): React.JSX.Element {
  const theme = useTheme()
  const themeTokens = TOKENS[theme]
  const [notation, setNotation] = useState(controlledNotation ?? defaultNotation)
  const [rolling, setRolling] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tokens = useMemo(() => tokenize(notation), [notation])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (controlledNotation === undefined) return
    setNotation(controlledNotation)
    setRolling(false)
  }, [controlledNotation, resetToken])

  const isValid = notation.length > 0 && isDiceNotation(notation)

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setRolling(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const result = roll(notation)
        if (result.rolls.length === 0) {
          setRolling(false)
          return
        }
        onRoll?.({ total: result.total, records: result.rolls, notation })
      } catch {
        // invalid notation — isDiceNotation guard above should prevent this
      }
      setRolling(false)
    }, 300)
  }, [notation, isValid, onRoll])

  const handleChange = useCallback(
    (text: string) => {
      setNotation(text)
      setRolling(false)
      onChange?.(text)
    },
    [onChange]
  )

  const handlePress = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const h = require('expo-haptics')
      h.impactAsync(h.ImpactFeedbackStyle.Medium)
    } catch {}
    handleRoll()
  }, [handleRoll])

  const descContent = useMemo(() => {
    if (notation.length === 0) {
      return (
        <Text style={[styles.descText, { color: themeTokens.textDim }]}>
          {'Try: 4d6L, 1d20+5, 2d8!'}
        </Text>
      )
    }
    if (!isValid) {
      return (
        <Text style={[styles.descText, { color: themeTokens.error }]}>{'Invalid notation'}</Text>
      )
    }
    return tokens
      .map((token, tokenIdx) => ({ token, tokenIdx }))
      .filter(({ token }) => Boolean(token.description))
      .map(({ token, tokenIdx }, i) => {
        const sep =
          i === 0
            ? null
            : token.category === 'Core'
              ? token.text.startsWith('-')
                ? ' \u2212 '
                : ' + '
              : ', '
        const color = tokenColor(NOTATION_DOCS[token.key], theme)
        return (
          <Fragment key={tokenIdx}>
            {sep !== null && (
              <Text style={[styles.descSep, { color: themeTokens.textMuted }]}>{sep}</Text>
            )}
            <Text
              style={[
                styles.descText,
                color !== undefined ? { color } : { color: themeTokens.text }
              ]}
            >
              {token.description}
            </Text>
          </Fragment>
        )
      })
  }, [notation, isValid, tokens, theme])

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputWrap,
            { borderColor: themeTokens.border, backgroundColor: themeTokens.surfaceAlt }
          ]}
        >
          <TokenOverlayInput
            value={notation}
            onChangeText={handleChange}
            tokens={tokens}
            theme={theme}
            placeholder="1d20"
            onSubmitEditing={handleRoll}
          />
        </View>
        <Pressable
          style={[
            styles.rollButton,
            { backgroundColor: isValid && !rolling ? themeTokens.accent : themeTokens.border }
          ]}
          onPress={handlePress}
          disabled={!isValid || rolling}
          accessibilityLabel="Roll the dice"
          accessibilityRole="button"
        >
          <Text style={[styles.rollButtonText, { color: themeTokens.surface }]}>{'ROLL'}</Text>
        </Pressable>
      </View>
      <View style={styles.descRow}>{descContent}</View>
    </View>
  )
}
