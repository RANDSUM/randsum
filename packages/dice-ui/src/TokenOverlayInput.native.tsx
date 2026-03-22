import React, { useEffect, useRef } from 'react'
import type { TextInput as RNTextInput } from 'react-native'
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { Token } from '@randsum/roller/tokenize'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { tokenColor } from './tokenColor'

export interface TokenOverlayInputNativeProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly tokens: readonly Token[]
  readonly theme?: 'light' | 'dark'
  readonly placeholder?: string
  readonly onSubmitEditing?: () => void
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

const PLAIN_COLORS = {
  dark: '#98c379',
  light: '#417e38'
}

const FONT_SIZE = 20
const CURSOR_HEIGHT = 24
const CURSOR_WIDTH = 2

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 48,
    justifyContent: 'center'
  },
  tokenDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tokenText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: FONT_SIZE
  },
  placeholderText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: FONT_SIZE
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: FONT_SIZE
  },
  cursor: {
    width: CURSOR_WIDTH,
    height: CURSOR_HEIGHT,
    borderRadius: 1
  }
})

function BlinkingCursor({ color }: { readonly color: string }): React.JSX.Element {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return <Animated.View style={[styles.cursor, { backgroundColor: color, opacity }]} />
}

export function TokenOverlayInput({
  value,
  onChangeText,
  tokens,
  theme = 'dark',
  placeholder,
  onSubmitEditing
}: TokenOverlayInputNativeProps): React.JSX.Element {
  const inputRef = useRef<RNTextInput>(null)
  const themeTokens = TOKENS[theme]
  const [isFocused, setIsFocused] = React.useState(false)

  const handlePress = (): void => {
    inputRef.current?.focus()
  }

  const hasTokens = tokens.length > 0
  const isEmpty = value.length === 0

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.tokenDisplay}>
        {isEmpty && placeholder !== undefined ? (
          <Text style={[styles.placeholderText, { color: themeTokens.textDim }]}>
            {placeholder}
          </Text>
        ) : hasTokens ? (
          tokens.map((token, i) => {
            const doc = NOTATION_DOCS[token.key]
            const color = tokenColor(doc, theme) ?? themeTokens.text
            return (
              <Text key={i} style={[styles.tokenText, { color }]}>
                {token.text}
              </Text>
            )
          })
        ) : (
          <Text style={[styles.tokenText, { color: PLAIN_COLORS[theme] }]}>{value}</Text>
        )}
        {isFocused && <BlinkingCursor color={themeTokens.accent} />}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        returnKeyType="go"
        autoComplete="off"
      />
    </Pressable>
  )
}
