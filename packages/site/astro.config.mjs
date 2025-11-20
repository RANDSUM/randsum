// @ts-check
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import netlify from '@astrojs/netlify'

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://randsum.github.io',
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ],
  output: 'static',
  adapter: netlify()
})
