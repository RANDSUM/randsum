// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightPageActions from 'starlight-page-actions'
import starlightSidebarTopics from 'starlight-sidebar-topics'
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import { copySchemaToDist } from './src/integrations/copy-schema-to-dist'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
const isDev = process.argv.includes('dev')

function resolveAdapter() {
  if (isDev) return undefined

  return cloudflare({
    // Prerender in Node, not in workerd — which is the adapter's default.
    //
    // The workerd sandbox refuses WebAssembly compilation ("Wasm code
    // generation disallowed by embedder"), and Shiki's default Oniguruma
    // highlighter is Wasm-backed, so every page carrying a code block fails to
    // render. That is most of a docs site. The same sandbox also breaks the
    // markdown pipeline's `require('path')`.
    //
    // Shiki can be pointed at a pure-JavaScript regex engine instead, and that
    // also works — but it changes how code is highlighted, on a live site.
    // Prerendering in Node changes nothing about the output at all: it is the
    // same environment the Netlify build used, so the two targets produce
    // identical pages. That equivalence is what made the cutover verifiable.
    prerenderEnvironment: 'node'
  })
}

export default defineConfig({
  base: '/',
  // Legacy 301 redirects for old URL shapes.
  //
  // Keep these in Astro config rather than in any host-level redirect file.
  // Astro emits them into `dist/_redirects` AND bakes them into the SSR
  // function's own route manifest, so they resolve either way — which is what
  // made them survive the move off Netlify without being touched.
  //
  // They also stay 301 under Cloudflare, verified against the live site. Worth
  // stating because Workers Static Assets issues **307** for its own
  // trailing-slash handling, and that status is not configurable — so "the site
  // returns 307 sometimes" is expected and is a different mechanism from these.
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
  // `URL` and `DEPLOY_PRIME_URL` were Netlify's deploy-context variables, used
  // so preview deploys emitted their own absolute URLs. Cloudflare sets neither,
  // so the fallback was the only branch that ever ran after the migration.
  site: 'https://randsum.dev',
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
  adapter: resolveAdapter()
})
