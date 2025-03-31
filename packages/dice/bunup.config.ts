import { defineConfig } from 'bunup'
import rootConfig from '../bunup.root.config'

export default defineConfig({
  ...rootConfig,
  clean: false,
  external: ['@randsum/notation', '@randsum/core']
})
