// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

import react from '@astrojs/react'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://playground.randsum.dev',
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@randsum/roller/tokenize': resolve(__dirname, '../../packages/roller/src/tokenize.ts'),
        '@randsum/roller/docs': resolve(__dirname, '../../packages/roller/src/docs/index.ts'),
        '@randsum/roller/trace': resolve(__dirname, '../../packages/roller/src/trace/index.ts'),
        '@randsum/roller/roll': resolve(__dirname, '../../packages/roller/src/roll/index.ts'),
        '@randsum/roller/validate': resolve(__dirname, '../../packages/roller/src/validate.ts'),
        '@randsum/roller': resolve(__dirname, '../../packages/roller/src/index.ts'),
        '@randsum/dice-ui': resolve(__dirname, '../../packages/dice-ui/src/index.ts')
      }
    }
  }
})
