/**
 * Portable Discord primitives — safe on Node and on workerd.
 *
 * Builders and enums are pure data construction with no runtime dependency on
 * a connection. They live in `@discordjs/builders` and `discord-api-types`,
 * ordinary portable packages, so a command file compiles for the Worker with
 * no aliasing, no bundler tricks, and no second implementation.
 *
 * The rule this encodes: **command files import from here.**
 *
 * The Components V2 builders (`ContainerBuilder`, `SectionBuilder`,
 * `TextDisplayBuilder`, `SeparatorBuilder`, `ThumbnailBuilder`) are here for
 * the same reason as the rest: they are pure data construction, and they ship
 * in the version already pinned — Components V2 needed no dependency bump.
 */
export {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} from '@discordjs/builders'

export {
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  SeparatorSpacingSize
} from 'discord-api-types/v10'

export type { SlashCommandIntegerOption, SlashCommandStringOption } from '@discordjs/builders'

export type {
  APIAllowedMentions,
  APIContainerComponent,
  APIInteraction,
  APIInteractionResponse,
  APIMessageComponentInteraction
} from 'discord-api-types/v10'
