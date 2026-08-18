import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder
} from 'discord.js'
// Deliberately the portable builder, not discord.js's. discord.js does not
// re-export @discordjs/builders verbatim — it *subclasses* EmbedBuilder, adding
// `.length` and accepting hex-string colours. The two are therefore distinct
// types, and a command that returns one cannot satisfy a signature demanding
// the other. Since command renderers must run on workerd, the portable one wins
// and the gateway path accepts it happily (it is a JSONEncodable<APIEmbed>).
import type { EmbedBuilder } from './utils/builders.js'
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
