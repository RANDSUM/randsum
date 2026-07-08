import { roll as rollBlades } from '@randsum/games/blades'
import { roll as rollDaggerheart } from '@randsum/games/daggerheart'
import { roll as rollFate } from '@randsum/games/fate'
import { roll as rollFifth } from '@randsum/games/fifth'
import { roll as rollPbta } from '@randsum/games/pbta'
import { roll as rollRootRpg } from '@randsum/games/root-rpg'
import { roll as rollSalvageunion } from '@randsum/games/salvageunion'
import type { GameShortcode } from '@randsum/games'
import type { RollRecord } from '@randsum/roller'

/**
 * The set of game systems this server can roll for.
 *
 * This mirrors `AVAILABLE_GAMES` from `@randsum/games`, but is declared locally
 * rather than imported at runtime: the games package's built barrel
 * (`dist/index.js`) currently has a bunup code-splitting bug that drops the
 * chunk imports backing that export, so a runtime
 * `import { AVAILABLE_GAMES } from '@randsum/games'` throws. The per-game
 * subpaths imported above are self-contained and unaffected. Correctness is
 * still enforced at compile time: `server.ts` feeds this list to `z.enum` and
 * passes the parsed `game` to `rollGame(game: GameShortcode, …)`, so a wrong
 * entry fails typecheck there, and the exhaustive `switch` below (its `never`
 * default) fails typecheck if `@randsum/games` ever adds a game this omits.
 */
export const AVAILABLE_GAMES = [
  'blades',
  'daggerheart',
  'fate',
  'fifth',
  'pbta',
  'root-rpg',
  'salvageunion'
] as const

/** Advantage/disadvantage flag shared by several game systems. */
export type RollingWith = 'Advantage' | 'Disadvantage'

/**
 * Flexible, flattened inputs for `roll_game`. Only the fields relevant to the
 * chosen game are read; a required field missing for its game throws.
 */
export interface GameParams {
  /** Blades in the Dark: action rating. */
  readonly rating?: number | undefined
  /** Daggerheart / Fate / D&D 5e: flat modifier. */
  readonly modifier?: number | undefined
  /** Daggerheart: amplify the Hope die. */
  readonly amplifyHope?: boolean | undefined
  /** Daggerheart: amplify the Fear die. */
  readonly amplifyFear?: boolean | undefined
  /** Daggerheart / 5e / PbtA / Root: advantage or disadvantage. */
  readonly rollingWith?: RollingWith | undefined
  /** D&D 5e: roll critical (double dice). */
  readonly crit?: boolean | undefined
  /** Powered by the Apocalypse: stat value (required for pbta). */
  readonly stat?: number | undefined
  /** Powered by the Apocalypse: forward bonus. */
  readonly forward?: number | undefined
  /** Powered by the Apocalypse: ongoing bonus. */
  readonly ongoing?: number | undefined
  /** Root RPG: bonus applied to the roll (required for root-rpg). */
  readonly bonus?: number | undefined
  /** Salvage Union: name of the table to roll on (required for salvageunion). */
  readonly tableName?: string | undefined
}

/** Structured result returned by the `roll_game` tool handler. */
export interface RollGameToolResult {
  readonly game: GameShortcode
  readonly total: number
  readonly result: unknown
  readonly details: unknown
  readonly rolls: readonly number[]
}

function normalize(
  game: GameShortcode,
  result: {
    readonly total: number
    readonly result: unknown
    readonly rolls: readonly RollRecord[]
    readonly details?: unknown
  }
): RollGameToolResult {
  return {
    game,
    total: result.total,
    result: result.result,
    details: 'details' in result ? result.details : undefined,
    rolls: result.rolls.flatMap(record => record.rolls)
  }
}

/**
 * Rolls for a specific game system, mapping the flexible `params` object onto
 * the chosen game's typed `roll()` input. Throws when a required field for the
 * chosen game is missing.
 */
export function rollGame(game: GameShortcode, params: GameParams): RollGameToolResult {
  switch (game) {
    case 'blades':
      return normalize(
        game,
        rollBlades({ ...(params.rating !== undefined && { rating: params.rating }) })
      )
    case 'daggerheart':
      return normalize(
        game,
        rollDaggerheart({
          ...(params.modifier !== undefined && { modifier: params.modifier }),
          ...(params.amplifyHope !== undefined && { amplifyHope: params.amplifyHope }),
          ...(params.amplifyFear !== undefined && { amplifyFear: params.amplifyFear }),
          ...(params.rollingWith !== undefined && { rollingWith: params.rollingWith })
        })
      )
    case 'fate':
      return normalize(
        game,
        rollFate({ ...(params.modifier !== undefined && { modifier: params.modifier }) })
      )
    case 'fifth':
      return normalize(
        game,
        rollFifth({
          ...(params.modifier !== undefined && { modifier: params.modifier }),
          ...(params.rollingWith !== undefined && { rollingWith: params.rollingWith }),
          ...(params.crit !== undefined && { crit: params.crit })
        })
      )
    case 'pbta': {
      if (params.stat === undefined) {
        throw new Error('roll_game: "pbta" requires params.stat')
      }
      return normalize(
        game,
        rollPbta({
          stat: params.stat,
          ...(params.forward !== undefined && { forward: params.forward }),
          ...(params.ongoing !== undefined && { ongoing: params.ongoing }),
          ...(params.rollingWith !== undefined && { rollingWith: params.rollingWith })
        })
      )
    }
    case 'root-rpg': {
      if (params.bonus === undefined) {
        throw new Error('roll_game: "root-rpg" requires params.bonus')
      }
      return normalize(
        game,
        rollRootRpg({
          bonus: params.bonus,
          ...(params.rollingWith !== undefined && { rollingWith: params.rollingWith })
        })
      )
    }
    case 'salvageunion': {
      if (params.tableName === undefined) {
        throw new Error('roll_game: "salvageunion" requires params.tableName')
      }
      return normalize(game, rollSalvageunion({ tableName: params.tableName }))
    }
    default: {
      const exhaustive: never = game
      throw new Error(`roll_game: unknown game "${String(exhaustive)}"`)
    }
  }
}
