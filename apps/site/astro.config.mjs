// @ts-check
import { defineConfig, fontProviders } from 'astro/config'

import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightPageActions from 'starlight-page-actions'
import starlightSidebarTopics from 'starlight-sidebar-topics'
import react from '@astrojs/react'
import { curatedLlmsTxt } from './src/integrations/curated-llms-txt'

// https://astro.build/config
export default defineConfig({
  base: '/',
  // Legacy 301 redirects for old URL shapes live in `public/_redirects`, which
  // Workers Static Assets serves as real 301s. Astro's own `redirects` option
  // would only emit meta-refresh pages without an adapter.
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
            label: 'Tools',
            link: '/tools/discord-bot/',
            icon: 'setting',
            items: [
              { label: 'MCP Server', slug: 'tools/mcp' },
              { label: 'Discord Bot', slug: 'tools/discord-bot' },
              { label: 'Claude Plugin', slug: 'tools/claude-code-plugin' },
              { label: 'HTTP API & Schema', slug: 'tools/http-api' }
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
