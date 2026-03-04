// @ts-check
import { defineConfig } from 'astro/config'

import starlight from '@astrojs/starlight'
import netlify from '@astrojs/netlify'
import react from '@astrojs/react'

// https://astro.build/config
const isDev = process.argv.includes('dev')

export default defineConfig({
  base: '/',
  site: process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? 'https://randsum.dev',
  integrations: [
    starlight({
      title: 'RANDSUM',
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
          label: 'Discord',
          href: 'https://discord.gg/randsum'
        }
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' }
          ]
        },
        {
          label: 'Reference',
          items: [
            { label: 'Dice Notation', slug: 'reference/dice-notation' },
            { label: 'Roll Options', slug: 'reference/roll-options' },
            { label: 'Modifiers', slug: 'reference/modifiers' }
          ]
        },
        {
          label: 'Packages',
          items: [
            { label: 'Overview', slug: 'packages/overview' },
            { label: '@randsum/roller', slug: 'packages/roller' }
          ]
        },
        {
          label: 'Games',
          items: [
            { label: 'Overview', slug: 'games/overview' },
            { label: 'Game Comparison', slug: 'games/comparison' },
            { label: 'Blades in the Dark', slug: 'games/blades' },
            { label: 'Daggerheart', slug: 'games/daggerheart' },
            { label: 'D&D 5e', slug: 'games/fifth' },
            {
              label: 'Powered by the Apocalypse',
              slug: 'games/pbta'
            },
            { label: 'Root RPG', slug: 'games/root-rpg' },
            { label: 'Salvage Union', slug: 'games/salvageunion' }
          ]
        },
        {
          label: 'Tools',
          items: [
            { label: 'Discord Bot', slug: 'tools/discord-bot' },
            {
              label: 'LLM Skill',
              items: [
                { label: 'Overview', slug: 'tools/skill' },
                { label: 'Skill Definition', slug: 'tools/skill/dice-rolling' },
                { label: 'Notation Reference', slug: 'tools/skill/notation' },
                { label: 'Game Systems', slug: 'tools/skill/game-systems' }
              ]
            }
          ]
        }
      ]
    }),
    react()
  ],
  output: 'static',
  adapter: isDev ? undefined : netlify()
})
