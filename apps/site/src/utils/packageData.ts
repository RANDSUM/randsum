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
    id: 'roller',
    name: 'roller',
    displayName: 'Roller',
    description: 'Zero-dependency dice engine with built-in notation parsing and validation.',
    npmPackage: '@randsum/roller',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/roller',
    version: '3.0.0',
    category: 'core',
    color: '#f8fafc' // white (slate-50) — uses --tool-roller CSS var which adapts dark/light
  },
  {
    id: 'games',
    name: 'games',
    displayName: 'Games',
    description: 'Pre-built dice resolvers for popular tabletop RPGs. One package, six systems.',
    npmPackage: '@randsum/games',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '1.0.0',
    category: 'core',
    color: '#a855f7' // purple accent
  }
]

export const gamePackages: PackageInfo[] = [
  {
    id: 'blades',
    name: 'blades',
    displayName: 'Blades in the Dark',
    description:
      'Roll action dice. Resolve critical, success, partial, or failure for Blades in the Dark.',
    npmPackage: '@randsum/games/blades',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#64748b' // slate-500 — noir, shadowy
  },
  {
    id: 'daggerheart',
    name: 'daggerheart',
    displayName: 'Daggerheart',
    description:
      'Roll hope and fear dice, see which dominates, detect critical hope for Daggerheart.',
    npmPackage: '@randsum/games/daggerheart',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#eab308' // yellow-500 — gold
  },
  {
    id: 'fifth',
    name: 'fifth',
    displayName: 'D&D 5th Edition',
    description: 'd20 roll resolution for D&D 5e.',
    npmPackage: '@randsum/games/fifth',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#dc2626' // red
  },
  {
    id: 'root-rpg',
    name: 'root-rpg',
    displayName: 'Root RPG',
    description: 'Roll 2d6+bonus. Strong hit, weak hit, or miss for Root: The RPG.',
    npmPackage: '@randsum/games/root-rpg',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#22c55e' // green
  },
  {
    id: 'salvageunion',
    name: 'salvageunion',
    displayName: 'Salvage Union',
    description: 'd20 table lookups for Salvage Union.',
    npmPackage: '@randsum/games/salvageunion',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#f59e0b' // amber — industrial/salvage aesthetic
  },
  {
    id: 'pbta',
    name: 'pbta',
    displayName: 'Powered by the Apocalypse',
    description:
      'Roll 2d6+stat. Miss, weak hit, or strong hit for any Powered by the Apocalypse game.',
    npmPackage: '@randsum/games/pbta',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: '3.0.0',
    category: 'game',
    color: '#6b7280' // grey
  }
]

export const toolPackages: PackageInfo[] = [
  {
    id: 'skill',
    name: 'skill',
    displayName: 'Claude Skills',
    description:
      'Three skills that give AI agents dice rolling, probability analysis, and game spec authoring.',
    npmPackage: 'skills/dice-rolling/SKILL.md',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/skills',
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
    version: '1.1.2',
    category: 'tool',
    color: '#5865F2' // Discord purple
  },
  {
    id: 'cli',
    name: 'cli',
    displayName: 'CLI',
    description:
      'Command-line interface for rolling dice and exploring notation from your terminal.',
    npmPackage: '@randsum/cli',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/apps/cli',
    category: 'tool',
    color: '#84cc16' // lime-500 — terminal/dev feel
  }
]
