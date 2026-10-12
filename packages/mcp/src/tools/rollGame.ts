import { inputs as bladesInputs, roll as rollBlades } from '@randsum/games/blades'
import { inputs as daggerheartInputs, roll as rollDaggerheart } from '@randsum/games/daggerheart'
import { inputs as fateInputs, roll as rollFate } from '@randsum/games/fate'
import { inputs as fifthInputs, roll as rollFifth } from '@randsum/games/fifth'
import { inputs as pbtaInputs, roll as rollPbta } from '@randsum/games/pbta'
import { inputs as rootRpgInputs, roll as rollRootRpg } from '@randsum/games/root-rpg'
import { inputs as salvageunionInputs, roll as rollSalvageunion } from '@randsum/games/salvageunion'
import type { GameShortcode } from '@randsum/games'
import type { InputDeclaration } from '@randsum/games/schema'
import type { RollRecord } from '@randsum/roller'

/** One game's input declarations, keyed by input name. */
export type GameInputs = Readonly<Record<string, InputDeclaration>>

/**
 * Each game's input declarations, exactly as its `.randsum.json` spec states
 * them. The `roll_game` schema and the required-field check both read these,
 * so a range or enum changes in the spec and nowhere else.
 */
export const GAME_INPUTS: Readonly<Record<GameShortcode, GameInputs>> = {
  blades: bladesInputs,
  daggerheart: daggerheartInputs,
  fate: fateInputs,
  fifth: fifthInputs,
  pbta: pbtaInputs,
  'root-rpg': rootRpgInputs,
  salvageunion: salvageunionInputs
}

/** An input is required when the spec gives it neither a default nor `optional`. */
export function isRequiredInput(decl: InputDeclaration): boolean {
  return decl.default === undefined && decl.optional !== true
}

/**
 * Flexible inputs for `roll_game`, keyed by the chosen game's input names. Only
 * the fields that game declares are read; a required field missing throws.
 */
export type GameParams = Readonly<Record<string, unknown>>

/**
 * Picks the inputs `game` declares out of `params`, throwing when a required
 * one is missing. Types, ranges and enums are checked by the `roll_game`
 * schema in `server.ts`, and ranges again by the game's own `roll()`.
 */
function gameInput(game: GameShortcode, params: GameParams): Readonly<Record<string, unknown>> {
  const declared = Object.entries(GAME_INPUTS[game])
  const missing = declared.find(
    ([name, decl]) => isRequiredInput(decl) && params[name] === undefined
  )
  if (missing !== undefined) {
    throw new Error(`roll_game: "${game}" requires params.${missing[0]}`)
  }
  return Object.fromEntries(
    declared.flatMap(([name]) => {
      const value = params[name]
      return value === undefined ? [] : [[name, value]]
    })
  )
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
 * chosen game is missing. `input` holds only spec-declared keys with defined
 * values, which is the shape each `roll()` input type describes.
 */
export function rollGame(game: GameShortcode, params: GameParams): RollGameToolResult {
  const input = gameInput(game, params)
  switch (game) {
    case 'blades':
      return normalize(game, rollBlades(input as Parameters<typeof rollBlades>[0]))
    case 'daggerheart':
      return normalize(game, rollDaggerheart(input as Parameters<typeof rollDaggerheart>[0]))
    case 'fate':
      return normalize(game, rollFate(input as Parameters<typeof rollFate>[0]))
    case 'fifth':
      return normalize(game, rollFifth(input as Parameters<typeof rollFifth>[0]))
    case 'pbta':
      return normalize(game, rollPbta(input as Parameters<typeof rollPbta>[0]))
    case 'root-rpg':
      return normalize(game, rollRootRpg(input as Parameters<typeof rollRootRpg>[0]))
    case 'salvageunion':
      return normalize(game, rollSalvageunion(input as Parameters<typeof rollSalvageunion>[0]))
    default: {
      const exhaustive: never = game
      throw new Error(`roll_game: unknown game "${String(exhaustive)}"`)
    }
  }
}
