// @ts-check
import { defineConfig } from 'astro/config'
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
  site: process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? 'https://randsum.dev',
  integrations: [
    starlight({
      title: 'RANDSUM — TypeScript Dice Rolling Library for Tabletop RPGs',
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
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'FAQ', slug: 'getting-started/faq' }
          ]
        },
        {
          label: 'Reference',
          items: [
            { label: 'Dice Notation', slug: 'reference/dice-notation' },
            { label: 'Roll Options', slug: 'reference/roll-options' },
            { label: 'Modifiers', slug: 'reference/modifiers' },
            { label: 'Changelog', slug: 'reference/changelog' }
          ]
        },
        {
          label: 'Guides',
          items: [
            { label: 'Error Handling', slug: 'guides/error-handling' },
            { label: 'Recipes', slug: 'guides/recipes' },
            { label: 'Custom Game Packages', slug: 'guides/custom-game-packages' },
            { label: 'Testing', slug: 'guides/testing' },
            { label: 'Troubleshooting', slug: 'guides/troubleshooting' }
          ]
        },
        {
          label: 'Core',
          items: [
            { label: 'Overview', slug: 'packages/overview' },
            { label: '@randsum/notation', slug: 'packages/notation' },
            { label: '@randsum/roller', slug: 'packages/roller' }
          ]
        },
        {
          label: 'Games',
          items: [
            { label: 'Overview', slug: 'games/overview' },
            { label: 'Blades in the Dark', slug: 'games/blades' },
            { label: 'Daggerheart', slug: 'games/daggerheart' },
            { label: 'D&D 5e', slug: 'games/fifth' },
            { label: 'Powered by the Apocalypse', slug: 'games/pbta' },
            { label: 'Root RPG', slug: 'games/root-rpg' },
            { label: 'Salvage Union', slug: 'games/salvageunion' }
          ]
        },
        {
          label: 'LLM Skill',
          items: [
            { label: 'Overview', slug: 'tools/skill' },
            { label: 'Skill Definition', slug: 'tools/skill/dice-rolling' },
            { label: 'Notation Reference', slug: 'tools/skill/notation' },
            { label: 'Game Systems', slug: 'tools/skill/game-systems' }
          ]
        },
        {
          label: 'Components',
          items: [
            { label: 'Overview', slug: 'tools/components' },
            { label: 'RollerPlayground', slug: 'tools/components/roller-playground' },
            { label: 'ModifierReference', slug: 'tools/components/modifier-reference' }
          ]
        },
        {
          label: 'CLI',
          items: [{ label: 'Overview', slug: 'tools/cli' }]
        },
        {
          label: 'Discord Bot',
          items: [{ label: 'Overview', slug: 'tools/discord-bot' }]
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
