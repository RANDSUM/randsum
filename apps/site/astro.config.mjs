// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightPageActions from 'starlight-page-actions'
import starlightSidebarTopics from 'starlight-sidebar-topics'
import netlify from '@astrojs/netlify'
import react from '@astrojs/react'
import { copyMarkdownToDist } from './src/integrations/copy-markdown-to-dist'
import { copySchemaToDist } from './src/integrations/copy-schema-to-dist'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
const isDev = process.argv.includes('dev')

export default defineConfig({
  base: '/',
  // Legacy 301 redirects for old URL shapes. These MUST live here rather than in
  // netlify.toml [[redirects]]: this site ships an on-demand SSR function
  // (`src/pages/api/roll.ts`, `prerender = false`), and @astrojs/netlify then
  // registers that function at `/*` with `preferStatic: true`. An explicit toml
  // redirect is matched BEFORE the request reaches the function's `/*` route, so
  // toml redirects (and, fatally, a toml `/*` catch-all) shadow the function.
  // Declared here, Astro emits these into dist/_redirects (301) AND bakes them
  // into the function's own route manifest, so they resolve regardless of
  // Netlify precedence. netlify.toml deliberately carries NO redirects now — the
  // SSR function serves the 404 page (404 status) for unmatched routes itself.
  redirects: {
    // Old package URLs → new game/tool pages
    '/packages/fifth/': { status: 301, destination: '/games/fifth/' },
    '/packages/blades/': { status: 301, destination: '/games/blades/' },
    '/packages/daggerheart/': { status: 301, destination: '/games/daggerheart/' },
    '/packages/pbta/': { status: 301, destination: '/games/pbta/' },
    '/packages/root-rpg/': { status: 301, destination: '/games/root-rpg/' },
    '/packages/salvageunion/': { status: 301, destination: '/games/salvageunion/' },
    '/packages/discord-bot/': { status: 301, destination: '/tools/discord-bot/' },
    // Old docs URLs → new reference pages
    '/docs/notation/': { status: 301, destination: '/notation/randsum-dice-notation/' },
    '/docs/errors/': { status: 301, destination: '/roller/modifiers/' },
    // Old getting-started URLs → new locations
    '/getting-started/notation/': { status: 301, destination: '/roller/getting-started/' },
    '/getting-started/game-packages/': { status: 301, destination: '/games/introduction/' }
  },
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
  ],
  site: process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? 'https://randsum.dev',
  integrations: [
    sitemap(),
    starlight({
      title: 'RANDSUM — TypeScript Dice Rolling Library for Tabletop RPGs',
      favicon: '/favicon.ico',
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://randsum.dev/og-image.svg' }
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://randsum.dev/og-image.svg' }
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' }
        }
      ],
      logo: {
        src: './src/assets/randsum-logo.png',
        replacesTitle: true
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/RANDSUM/randsum'
        },
        {
          icon: 'discord',
          label: 'Discord Bot',
          href: '/discord'
        }
      ],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        Footer: './src/components/Footer.astro'
      },
      plugins: [
        starlightPageActions({
          baseUrl: 'https://randsum.dev',
          actions: {
            chatgpt: true,
            claude: true,
            t3chat: true,
            v0: true,
            markdown: true
          }
        }),
        starlightSidebarTopics([
          {
            label: 'Start',
            link: '/welcome/introduction/',
            icon: 'open-book',
            items: [
              { label: 'Introduction', slug: 'welcome/introduction' },
              { label: 'Ecosystem Overview', slug: 'welcome/ecosystem-overview' },
              { label: 'Attribution', slug: 'welcome/attribution' }
            ]
          },
          {
            label: 'Roller',
            link: '/roller/introduction/',
            icon: 'random',
            items: [
              { label: 'Introduction', slug: 'roller/introduction' },
              { label: 'Getting Started', slug: 'roller/getting-started' },
              { label: 'Roll Options', slug: 'roller/roll-options' },
              { label: 'Modifiers', slug: 'roller/modifiers' },
              { label: 'Error Handling', slug: 'roller/error-handling' },
              { label: 'API Reference', slug: 'roller/api-reference' }
            ]
          },
          {
            label: 'Notation',
            link: '/notation/introduction/',
            icon: 'document',
            items: [
              { label: 'Introduction', slug: 'notation/introduction' },
              { label: 'Getting Started', slug: 'notation/getting-started' },
              {
                label: 'RDN Syntax Guide',
                slug: 'notation/randsum-dice-notation'
              },
              { label: 'Validation & Parsing', slug: 'notation/validation-and-parsing' },
              { label: 'API Reference', slug: 'notation/api-reference' },
              {
                label: 'Formal Specification',
                link: 'https://notation.randsum.dev',
                attrs: { target: '_blank' }
              }
            ]
          },
          {
            label: 'Games',
            link: '/games/introduction/',
            icon: 'puzzle',
            items: [
              { label: 'Introduction', slug: 'games/introduction' },
              { label: 'Getting Started', slug: 'games/getting-started' },
              {
                label: 'Schema',
                items: [
                  { label: 'Overview', slug: 'games/schema/overview' },
                  { label: 'Schema Reference', slug: 'games/schema/reference' },
                  { label: 'Using loadSpec()', slug: 'games/schema/using-loadspec' },
                  {
                    label: 'Contributing a Game',
                    slug: 'games/schema/contributing-a-game'
                  }
                ]
              },
              {
                label: 'Game Systems',
                items: [
                  { label: 'Blades in the Dark', slug: 'games/blades' },
                  { label: 'D&D 5e', slug: 'games/fifth' },
                  { label: 'Daggerheart', slug: 'games/daggerheart' },
                  { label: 'Fate Core', slug: 'games/fate' },
                  { label: 'Powered by the Apocalypse', slug: 'games/pbta' },
                  { label: 'Root RPG', slug: 'games/root-rpg' },
                  { label: 'Salvage Union', slug: 'games/salvageunion' }
                ]
              }
            ]
          },
          {
            label: 'Tools',
            link: '/tools/discord-bot/',
            icon: 'setting',
            items: [
              { label: 'Playground', link: 'https://randsum.io' },
              { label: 'CLI', slug: 'tools/cli' },
              { label: 'MCP Server', slug: 'tools/mcp' },
              { label: 'Discord Bot', slug: 'tools/discord-bot' },
              { label: 'Claude Plugin', slug: 'tools/claude-code-plugin' },
              { label: 'HTTP API & Schema', slug: 'tools/http-api' }
            ]
          }
        ])
      ],
      customCss: ['./src/styles/custom.css']
    }),
    react(),
    copyMarkdownToDist(),
    copySchemaToDist()
  ],
  prefetch: false,
  vite: {
    resolve: {
      alias: {
        '@randsum/dice-ui': resolve(__dirname, '../../packages/dice-ui/src/index.ts')
      }
    }
  },
  output: 'static',
  adapter: isDev ? undefined : netlify()
})
