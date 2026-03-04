import { createTamagui, type CreateTamaguiProps } from '@tamagui/core'
import { defaultConfig } from '@tamagui/config/v4'

const tamaguiConfig: CreateTamaguiProps = {
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dark: {
      ...defaultConfig.themes.dark,
      background: '#020617',
      backgroundHover: '#0f172a',
      backgroundPress: '#1e293b',
      backgroundFocus: '#1e293b',
      backgroundStrong: '#0f172a',
      backgroundMuted: '#1e293b',
      borderColor: '#334155',
      borderColorHover: '#475569',
      color: '#f8fafc',
      colorHover: '#e2e8f0',
      colorMuted: '#94a3b8',
      placeholderColor: '#64748b',
      accent: '#3b82f6',
      accentHigh: '#93c5fd',
    },
  },
} as CreateTamaguiProps

export const config = createTamagui(tamaguiConfig)

export default config

export type AppConfig = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}
