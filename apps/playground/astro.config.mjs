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
        '@randsum/roller': resolve(__dirname, '../../packages/roller/src/index.ts'),
        '@randsum/display-utils': resolve(__dirname, '../../packages/display-utils/src/index.ts')
      }
    }
  }
})
