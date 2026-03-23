import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder
} from 'discord.js'

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
}
