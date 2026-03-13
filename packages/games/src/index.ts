export { SchemaError } from './lib/errors'
export type { SchemaErrorCode } from './lib/errors'
export type { GameRollResult } from './types'

export const AVAILABLE_GAMES = [
  'blades',
  'daggerheart',
  'fifth',
  'pbta',
  'root-rpg',
  'salvageunion'
] as const

export type GameShortcode = (typeof AVAILABLE_GAMES)[number]
