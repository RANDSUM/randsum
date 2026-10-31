// @ts-check
import { defineConfig, fontProviders } from 'astro/config'

import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightPageActions from 'starlight-page-actions'
import starlightSidebarTopics from 'starlight-sidebar-topics'
import react from '@astrojs/react'
import { readdirSync } from 'node:fs'
import { curatedLlmsTxt } from './src/integrations/curated-llms-txt'

// The newest spec version. /spec/v/<latest>/ repeats /spec/ and names it as
// canonical (SpecLayout), so the sitemap lists only /spec/. Pre-releases are not
// handled here; src/spec/versions.ts orders those for the pages themselves.
const latestSpecVersion = readdirSync(new URL('./src/content/specs/', import.meta.url))
  .filter(file => file.endsWith('.md'))
  .map(file => file.replace(/^v/, '').replace(/\.md$/, ''))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  .at(-1)

// https://astro.build/config
export default defineConfig({
  base: '/',
  // Legacy 301 redirects for old URL shapes live in `public/_redirects`, which
  // Workers Static Assets serves as real 301s. Astro's own `redirects` option
  // would only emit meta-refresh pages without an adapter.
  fonts: [
    {
      name: 'Gabarito',
      cssVariable: '--font-gabarito',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700, 800],
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
  site: 'https://randsum.dev',
  vite: {
    // satteri (Starlight's Markdown renderer) loads a native binding relative to
    // its own files, which breaks once Vite bundles it into the prerender chunks.
    ssr: { external: ['satteri'] },
    environments: { prerender: { resolve: { external: ['satteri'] } } }
  },
  integrations: [
    // /app-shell/ is the Roller's shell, moved to app.randsum.dev by
    // scripts/build-app.ts; randsum.dev never serves it.
    sitemap({
      filter: page =>
        !page.includes('/app-shell/') && !page.endsWith(`/spec/v/${latestSpecVersion}/`)
    }),
    starlight({
      title: 'RANDSUM',
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://randsum.dev/og-image.png' }
        },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        {
          tag: 'meta',
          attrs: { property: 'og:image:alt', content: 'RANDSUM: Throw Dice, Not Exceptions.' }
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://randsum.dev/og-image.png' }
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' }
        }
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/RANDSUM/randsum'
        },
        {
          icon: 'discord',
          label: 'Discord Bot',
          href: '/tools/discord-bot/'
        }
      ],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        PageTitle: './src/components/PageTitle.astro',
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
              { label: 'Formal Specification', link: '/spec/' }
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
            label: 'API',
            link: '/api/introduction/',
            icon: 'rocket',
            items: [
              { label: 'Introduction', slug: 'api/introduction' },
              { label: 'Rolling Dice', slug: 'api/rolling' },
              { label: 'Game Systems', slug: 'api/games' },
              { label: 'Random Numbers', slug: 'api/random' },
              { label: 'Endpoint Reference', slug: 'api/reference' }
            ]
          },
          {
            label: 'Tools',
            link: '/tools/discord-bot/',
            icon: 'setting',
            items: [
              {
                label: 'AI Agents',
                items: [
                  { label: 'Overview', slug: 'tools/agents' },
                  { label: 'Claude Code Plugin', slug: 'tools/claude-code-plugin' },
                  { label: 'Claude Connector & MCP', slug: 'tools/mcp' }
                ]
              },
              { label: 'Discord Bot', slug: 'tools/discord-bot' },
              { label: 'Hosted Schema', slug: 'tools/http-api' }
            ]
          }
        ])
      ],
      customCss: ['./src/styles/theme.css', './src/styles/custom.css']
    }),
    // Must stay after starlight(): it rewrites the llms.txt that
    // starlight-page-actions generates in the same build:done phase.
    curatedLlmsTxt(),
    react()
  ],
  prefetch: false,
  output: 'static'
})
