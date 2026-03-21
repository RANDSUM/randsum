import { defineConfig, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://notation.randsum.dev',
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ['normal']
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ['normal']
    }
  ]
})
