import rollerPkg from '../../../../packages/roller/package.json'
import gamesPkg from '../../../../packages/games/package.json'

interface PackageInfo {
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
    version: rollerPkg.version,
    category: 'core'
  },
  {
    id: 'games',
    name: 'games',
    displayName: 'Games',
    description: 'Pre-built dice resolvers for popular tabletop RPGs. One package, seven systems.',
    npmPackage: '@randsum/games',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'core'
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
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'daggerheart',
    name: 'daggerheart',
    displayName: 'Daggerheart',
    description:
      'Roll hope and fear dice, see which dominates, detect critical hope for Daggerheart.',
    npmPackage: '@randsum/games/daggerheart',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'fate',
    name: 'fate',
    displayName: 'Fate Core',
    description:
      'Roll 4dF + skill against the Fate ladder. Resolve Terrible up to Legendary for Fate Core.',
    npmPackage: '@randsum/games/fate',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'fifth',
    name: 'fifth',
    displayName: 'D&D 5th Edition',
    description: 'd20 roll resolution for D&D 5e.',
    npmPackage: '@randsum/games/fifth',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'root-rpg',
    name: 'root-rpg',
    displayName: 'Root RPG',
    description: 'Roll 2d6+bonus. Strong hit, weak hit, or miss for Root: The RPG.',
    npmPackage: '@randsum/games/root-rpg',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'salvageunion',
    name: 'salvageunion',
    displayName: 'Salvage Union',
    description: 'd20 table lookups for Salvage Union.',
    npmPackage: '@randsum/games/salvageunion',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  },
  {
    id: 'pbta',
    name: 'pbta',
    displayName: 'Powered by the Apocalypse',
    description:
      'Roll 2d6+stat. Miss, weak hit, or strong hit for any Powered by the Apocalypse game.',
    npmPackage: '@randsum/games/pbta',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/games',
    version: gamesPkg.version,
    category: 'game'
  }
]

export const toolPackages: PackageInfo[] = [
  {
    id: 'skill',
    name: 'skill',
    displayName: 'Claude Plugin',
    description:
      'Claude Code plugin with skills for dice rolling, probability analysis, and game spec authoring.',
    npmPackage: 'plugins/randsum/skills/dice-rolling/SKILL.md',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/plugins/randsum',
    category: 'tool',
    color: 'var(--rs-claude)'
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
    color: 'var(--rs-discord)'
  },
  {
    id: 'mcp',
    name: 'mcp',
    displayName: 'MCP Server',
    description:
      'Model Context Protocol server exposing roll, validate, and roll_game tools to AI agents.',
    npmPackage: '@randsum/mcp',
    sourceUrl: 'https://github.com/RANDSUM/randsum/tree/main/packages/mcp',
    category: 'tool',
    color: 'var(--rs-claude)'
  }
]
