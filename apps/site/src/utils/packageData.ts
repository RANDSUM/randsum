export interface PackageInfo {
  id: string
  name: string
  displayName: string
  description: string
  npmPackage: string
  sourceUrl: string
  version?: string
  color?: string
  category: 'core' | 'game' | 'tool'
}

export const corePackages: PackageInfo[] = [
  {
    id: 'notation',
    name: 'notation',
    displayName: 'Notation',
    description: 'Zero-dependency dice notation parser and type foundation.',
    npmPackage: '@randsum/notation',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/notation',
    version: '3.0.0',
    category: 'core',
    color: '#e2e8f0' // slate-200 — neutral, foundational
  },
  {
    id: 'roller',
    name: 'roller',
    displayName: 'Roller',
    description: 'Zero-dependency dice engine with full notation support.',
    npmPackage: '@randsum/roller',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/roller',
    version: '1.1.2',
    category: 'core',
    color: '#f8fafc' // white (slate-50) — uses --tool-roller CSS var which adapts dark/light
  }
]

export const gamePackages: PackageInfo[] = [
  {
    id: 'blades',
    name: 'blades',
    displayName: 'Blades in the Dark',
    description: 'Action roll resolution for Blades in the Dark.',
    npmPackage: '@randsum/blades',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/blades',
    version: '1.1.0',
    category: 'game',
    color: '#f97316' // orange
  },
  {
    id: 'daggerheart',
    name: 'daggerheart',
    displayName: 'Daggerheart',
    description: 'Hope and fear roll resolution for Daggerheart.',
    npmPackage: '@randsum/daggerheart',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/daggerheart',
    version: '1.2.0',
    category: 'game',
    color: '#9333ea' // purple
  },
  {
    id: 'fifth',
    name: 'fifth',
    displayName: 'D&D 5th Edition',
    description: 'd20 roll resolution for D&D 5e.',
    npmPackage: '@randsum/fifth',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/fifth',
    version: '1.1.0',
    category: 'game',
    color: '#dc2626' // red
  },
  {
    id: 'root-rpg',
    name: 'root-rpg',
    displayName: 'Root RPG',
    description: '2d6 roll resolution for Root RPG.',
    npmPackage: '@randsum/root-rpg',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/root-rpg',
    version: '2.0.0',
    category: 'game',
    color: '#22c55e' // green
  },
  {
    id: 'salvageunion',
    name: 'salvageunion',
    displayName: 'Salvage Union',
    description: 'd20 table lookups for Salvage Union.',
    npmPackage: '@randsum/salvageunion',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/salvageunion',
    version: '1.1.0',
    category: 'game',
    color: '#60a5fa' // lightblue
  },
  {
    id: 'pbta',
    name: 'pbta',
    displayName: 'Powered by the Apocalypse',
    description: '2d6 roll resolution for any PbtA system.',
    npmPackage: '@randsum/pbta',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/pbta',
    version: '1.2.0',
    category: 'game',
    color: '#6b7280' // grey
  }
]

export const toolPackages: PackageInfo[] = [
  {
    id: 'component-library',
    name: 'component-library',
    displayName: 'Component Library',
    description: 'React components for embedding dice rollers in any web app.',
    npmPackage: '@randsum/component-library',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/component-library',
    version: '0.1.0',
    category: 'tool',
    color: '#3b82f6' // blue
  },
  {
    id: 'skill',
    name: 'skill',
    displayName: 'LLM Skill',
    description: 'Prompt file for teaching RANDSUM dice notation to any LLM.',
    npmPackage: 'skills/dice-rolling/SKILL.md',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/skills/dice-rolling',
    category: 'tool',
    color: '#06b6d4' // cyan-500 — AI/technical feel; distinct from Discord purple (#5865F2)
  },
  {
    id: 'discord-bot',
    name: 'discord-bot',
    displayName: 'Discord Bot',
    description: 'Discord bot with slash commands for all RANDSUM packages.',
    npmPackage: '@randsum/discord-bot',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/apps/discord-bot',
    version: '1.0.0',
    category: 'tool',
    color: '#5865F2' // Discord purple
  }
]
