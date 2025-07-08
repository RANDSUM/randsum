import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { URL, fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://randsum.github.io',
  base: '/randsum',
  output: 'static',
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(
          new URL('./src/components', import.meta.url)
        ),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
      }
    },

    plugins: [tailwindcss()]
  }
})
