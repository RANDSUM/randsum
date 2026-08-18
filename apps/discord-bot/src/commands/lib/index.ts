import { deferReplyHonoringHidden } from '../../utils/ephemeral.js'
import { replyWithError } from '../../utils/replyWithError.js'
import type { EmbedBuilder } from '../../utils/builders.js'
import type { ChatInputCommandInteraction } from '../../utils/discord.js'
import type { Command } from '../../types.js'
import type { CommandContext } from './context.js'

export type { CommandContext, CommandOptions } from './context.js'
export { optionsFromPayload } from './context.js'

/**
 * Build the transport-agnostic context from a live gateway interaction.
 *
 * discord.js's `interaction.options` already has the accessor shape
 * `CommandOptions` describes, so this is a narrowing rather than an adapter —
 * which is the point: the interface was defined to fit what already exists, so
 * neither transport pays a translation cost.
 */
export function contextFromInteraction(interaction: ChatInputCommandInteraction): CommandContext {
  return {
    options: interaction.options,
    // A getter, not a value. Only `/root` reads the display name, and reading
    // it eagerly here would touch `interaction.user` on every command — which
    // changes behaviour for the nine that never did, and immediately broke the
    // test fixtures that (reasonably) only mock what their command uses.
    // Deferring keeps this refactor genuinely invisible.
    get userDisplayName() {
      return interaction.user.displayName
    }
  }
}

interface CreateGameCommandOptions {
  readonly data: Command['data']
  readonly buildEmbed: (context: CommandContext) => EmbedBuilder
  readonly describeError?: (error: unknown, context: CommandContext) => string
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
 * autocomplete pass `autocomplete`.
 */
export function createGameCommand(options: CreateGameCommandOptions): Command {
  const { data, buildEmbed, describeError, autocomplete } = options

  return {
    data,
    // Exposed so a non-gateway transport can render without an interaction.
    // Same function the gateway path calls; there is no second implementation
    // to drift.
    buildEmbed,
    async execute(interaction) {
      await deferReplyHonoringHidden(interaction)
      const context = contextFromInteraction(interaction)

      try {
        const embed = buildEmbed(context)
        await interaction.editReply({ embeds: [embed] })
      } catch (error) {
        const description = describeError
          ? describeError(error, context)
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
