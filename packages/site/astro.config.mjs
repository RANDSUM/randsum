// @ts-check
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import netlify from '@astrojs/netlify'

// https://astro.build/config
export default defineConfig({
  base: '/',
  // Use Netlify's URL environment variable, fallback for local dev
  site: process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? 'https://randsum-site.netlify.app',
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
