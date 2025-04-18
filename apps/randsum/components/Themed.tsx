import { CustomDarkTheme, CustomLightTheme, useAppTheme } from '@/theme'
import React, { ComponentProps, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import {
  Button as PaperButton,
  Provider as PaperProvider,
  Surface as PaperSurface
} from 'react-native-paper'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme() ?? 'light'

  const theme = colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme

  return <PaperProvider theme={theme}>{children}</PaperProvider>
}

export function Button(props: ComponentProps<typeof PaperButton>) {
  const theme = useAppTheme()
  const getButtonColor = () => {
    if (props.mode === 'outlined') {
      return 'transparent'
    }
    return props.mode === 'contained' ? theme.colors.primary : 'transparent'
  }

  const getTextColor = () => {
    if (props.mode === 'outlined') {
      return theme.colors.primary
    }
    return props.mode === 'contained'
      ? theme.colors.onPrimary
      : theme.colors.primary
  }

  return (
    <PaperButton
      buttonColor={getButtonColor()}
      textColor={getTextColor()}
      mode={props.mode || 'text'}
      {...props}
      style={[{ elevation: 2, borderRadius: 4 }, props.style]}
    />
  )
}
export function View(props: React.ComponentProps<typeof PaperSurface>) {
  const { style, ...otherProps } = props
  return (
    <PaperSurface
      style={[{ backgroundColor: 'transparent' }, style]}
      elevation={0}
      {...otherProps}
    />
  )
}
