import { deferReplyHonoringHidden } from '../../utils/ephemeral.js'
import { replyWithError } from '../../utils/replyWithError.js'
import type { ChatInputCommandInteraction, EmbedBuilder } from '../../utils/discord.js'
import type { Command } from '../../types.js'

interface CreateGameCommandOptions {
  readonly data: Command['data']
  readonly buildEmbed: (interaction: ChatInputCommandInteraction) => EmbedBuilder
  readonly describeError?: (error: unknown, interaction: ChatInputCommandInteraction) => string
  readonly autocomplete?: Command['autocomplete']
}

/** Default message for the shared catch block: the error text, or a generic fallback. */
export function defaultErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

/**
 * Collapses the per-game command boilerplate — defer (honoring the `hidden`
 * option), build the embed, edit the reply, and reply with an error embed on
 * failure — into one place. Each command supplies only its `data`
 * (SlashCommandBuilder) and a `buildEmbed` that reads the interaction options
 * and returns an EmbedBuilder. Commands with bespoke error text (e.g. /roll's
 * "Did you mean" suggestion) pass `describeError`; commands with option
 * autocomplete (e.g. /su) pass `autocomplete`.
 */
export function createGameCommand(options: CreateGameCommandOptions): Command {
  const { data, buildEmbed, describeError, autocomplete } = options

  return {
    data,
    async execute(interaction) {
      await deferReplyHonoringHidden(interaction)

      try {
        const embed = buildEmbed(interaction)
        await interaction.editReply({ embeds: [embed] })
      } catch (error) {
        const description = describeError
          ? describeError(error, interaction)
          : defaultErrorMessage(error)
        await replyWithError(interaction, 'Error', description)
      }
    },
    ...(autocomplete ? { autocomplete } : {})
  }
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
