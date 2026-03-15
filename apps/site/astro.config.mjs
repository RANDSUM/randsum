// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

import starlight from '@astrojs/starlight'
import netlify from '@astrojs/netlify'
import react from '@astrojs/react'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://astro.build/config
const isDev = process.argv.includes('dev')

export default defineConfig({
  base: '/',
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
        }
      ],
      components: {
        Header: './src/components/Header.astro'
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'RANDSUM',
          items: [
            { label: 'Introduction', slug: 'welcome/introduction' },
            { label: 'Ecosystem Overview', slug: 'welcome/ecosystem-overview' }
          ]
        },
        {
          label: 'Roller',
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
          items: [
            { label: 'Introduction', slug: 'notation/introduction' },
            { label: 'Getting Started', slug: 'notation/getting-started' },
            {
              label: 'Randsum Dice Notation Spec',
              slug: 'notation/randsum-dice-notation'
            },
            { label: 'Validation & Parsing', slug: 'notation/validation-and-parsing' },
            { label: 'API Reference', slug: 'notation/api-reference' }
          ]
        },
        {
          label: 'Games',
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
                { label: 'Powered by the Apocalypse', slug: 'games/pbta' },
                { label: 'Root RPG', slug: 'games/root-rpg' },
                { label: 'Salvage Union', slug: 'games/salvageunion' }
              ]
            }
          ]
        },
        {
          label: 'Tools',
          items: [
            { label: 'Component Library', slug: 'tools/component-library' },
            { label: 'Display Utils', slug: 'tools/display-utils' },
            { label: 'Discord Bot', slug: 'tools/discord-bot' },
            { label: 'Claude Code Skill', slug: 'tools/claude-code-skill' }
          ]
        }
      ]
    }),
    react()
  ],
  output: 'static',
  adapter: isDev ? undefined : netlify(),
  vite: {
    resolve: {
      alias: {
        '@randsum/component-library': resolve(
          __dirname,
          '../../packages/component-library/src/index.ts'
        )
      }
    }
  }
})
