import { defineConfig, DefineConfigEntry } from 'bunup'
import baseConfig from '../../bunup.config.base'

export default defineConfig({
  ...baseConfig,
  external: ['@randsum/dice']
} as DefineConfigEntry)
