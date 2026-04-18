/**
 * discord.js re-export barrel.
 *
 * Historically this used `require()` because Bun on Linux CI couldn't
 * statically analyze discord.js v14's __exportStar re-exports. Bun 1.3+
 * handles this correctly — a direct ESM import resolves all 13 named
 * exports locally. Kept as a barrel so the remaining ~13 consumer files
 * import from one place; a future PR can inline the imports and delete
 * this file.
 */
export {
  ActionRowBuilder,
  ButtonBuilder,
  Client,
  Collection,
  ComponentType,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} from 'discord.js'

export type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Guild,
  Interaction,
  StringSelectMenuInteraction
} from 'discord.js'
