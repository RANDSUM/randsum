import React from 'react'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
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
  readonly isInvalid?: boolean
}

const THEME_TOKENS = {
  dark: {
    text: '#fafafa',
    textDim: '#71717a',
    surface: '#18181b',
    surfaceAlt: '#27272a',
    accent: '#a855f7',
    error: '#f97583'
  },
  light: {
    text: '#18181b',
    textDim: '#71717a',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    accent: '#9333ea',
    error: '#f97583'
  }
}

const PLAIN_COLORS = {
  dark: '#98c379',
  light: '#417e38'
}

/**
 * Native token overlay input.
 *
 * Architecture: A real TextInput is always rendered and interactive.
 * When there are tokens to colorize, the input text is made transparent
 * and a colored overlay is positioned on top with pointerEvents:'none'.
 * This gives native cursor, selection, and paste behavior for free.
 */
export function TokenOverlayInput({
  value,
  onChangeText,
  tokens,
  theme = 'dark',
  placeholder,
  onSubmitEditing,
  isInvalid = false
}: TokenOverlayInputNativeProps): React.JSX.Element {
  const themeTokens = THEME_TOKENS[theme]
  const hasTokens = tokens.length > 0
  const showOverlay = hasTokens || (isInvalid && value.length > 0)

  // When overlay is shown, make the real input text transparent so the
  // colored overlay text is visible instead. Caret stays visible.
  const inputTextColor = showOverlay ? 'transparent' : PLAIN_COLORS[theme]

  return (
    <View style={styles.container}>
      {/* Real TextInput — always interactive, handles cursor/selection/paste */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={themeTokens.textDim}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        returnKeyType="go"
        autoComplete="off"
        style={[
          styles.input,
          {
            color: inputTextColor,
            ...Platform.select({
              web: { caretColor: themeTokens.accent },
              default: {}
            })
          }
        ]}
      />

      {/* Colored overlay — positioned on top, non-interactive */}
      {showOverlay && (
        <View style={styles.overlay} pointerEvents="none">
          {isInvalid ? (
            <Text style={[styles.overlayText, { color: themeTokens.error }]}>{value}</Text>
          ) : (
            tokens.map((token, i) => {
              const doc = NOTATION_DOCS[token.key]
              const color = tokenColor(doc, theme) ?? themeTokens.text
              return (
                <Text key={`t${i}`} style={[styles.overlayText, { color }]}>
                  {token.text}
                </Text>
              )
            })
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    minHeight: 48
  },
  input: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 20,
    lineHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    letterSpacing: 0,
    minHeight: 48
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  overlayText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0
  }
})
