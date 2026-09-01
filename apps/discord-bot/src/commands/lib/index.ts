import type { EmbedBuilder } from '../../utils/builders.js'
import type { Command } from '../../types.js'
import type { CommandContext } from './context.js'

export type { CommandContext, CommandOptions } from './context.js'
export { optionsFromPayload } from './context.js'

interface CreateGameCommandOptions {
  readonly data: Command['data']
  readonly buildEmbed: (context: CommandContext) => EmbedBuilder
}

/** Default message for the shared catch block: the error text, or a generic fallback. */
export function defaultErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

/**
 * Pairs a command's `data` (SlashCommandBuilder) with its renderer.
 *
 * This used to collapse real per-command boilerplate — defer honoring the
 * `hidden` option, build the embed, edit the reply, reply with an error embed
 * on failure — because each command owned a gateway `execute`. All four of
 * those steps belong to the Worker dispatcher now, which does them once for
 * every command, so what is left here is the pairing itself.
 *
 * Kept rather than inlined because it gives every command one declared shape,
 * and because `buildEmbed` is optional on `Command` while it is required here:
 * a command built through this factory cannot omit its renderer.
 */
export function createGameCommand(options: CreateGameCommandOptions): Command {
  const { data, buildEmbed } = options

  return { data, buildEmbed }
}

/** Formats a modifier with an explicit sign: positive values gain a leading `+`. */
export function formatSignedModifier(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

/** Extracts the first roll record's pre-modifier dice, or an empty list. */
export function getInitialRolls(result: {
  readonly rolls: readonly { readonly initialRolls: readonly number[] }[]
}): readonly number[] {
  return result.rolls[0]?.initialRolls ?? []
}
