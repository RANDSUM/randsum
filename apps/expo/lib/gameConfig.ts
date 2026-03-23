import type { GameShortcode } from '@randsum/games'

export type SupportedGameId = GameShortcode

interface GameConfig {
  readonly name: string
  readonly color: string
  readonly shortcode: SupportedGameId
  readonly description: string
}

export const GAME_CONFIG: Readonly<Record<SupportedGameId, GameConfig>> = {
  blades: {
    name: 'Blades in the Dark',
    color: '#64748b',
    shortcode: 'blades',
    description: 'Action dice pool with position and effect'
  },
  fifth: {
    name: 'D&D 5th Edition',
    color: '#ca8a04',
    shortcode: 'fifth',
    description: 'd20 rolls with advantage, disadvantage, and modifiers'
  },
  daggerheart: {
    name: 'Daggerheart',
    color: '#d97706',
    shortcode: 'daggerheart',
    description: 'Hope and Fear dual d12 system'
  },
  pbta: {
    name: 'Powered by the Apocalypse',
    color: '#10b981',
    shortcode: 'pbta',
    description: '2d6 + stat with strong hit, weak hit, and miss'
  },
  'root-rpg': {
    name: 'Root RPG',
    color: '#22c55e',
    shortcode: 'root-rpg',
    description: '2d6 + bonus with hit tiers'
  },
  salvageunion: {
    name: 'Salvage Union',
    color: '#f97316',
    shortcode: 'salvageunion',
    description: 'd20 roll against salvage tables'
  }
}

export const GAME_LIST = Object.values(GAME_CONFIG)
