import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder
} from 'discord.js'
import type { CommandContext } from './commands/lib/context.js'

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
  /**
   * The transport-agnostic renderer, present on every factory-built command.
   *
   * `execute` is the gateway entry point and needs a live interaction to reply
   * through. A Worker has no such thing — it returns a response body — so it
   * calls this instead. Optional because the three hand-written commands
   * (`/help`, `/notation`, `/salvageunion`) do not go through the factory yet;
   * a Worker dispatch that finds it missing must say so rather than guess.
   */
  buildEmbed?: (context: CommandContext) => EmbedBuilder
}
