/**
 * Portable Discord primitives — safe on Node and on workerd.
 *
 * The counterpart to `discord.ts`, which is the *gateway* barrel: `Client`,
 * `Collection`, `Events`, `GatewayIntentBits`. Those exist only to hold and
 * service a WebSocket, and none of them can run on Workers.
 *
 * Everything here is different in kind. Builders and enums are pure data
 * construction with no runtime dependency on a connection — and crucially they
 * do not actually live in discord.js at all. discord.js re-exports them from
 * `@discordjs/builders` and `discord-api-types`, which are ordinary portable
 * packages. Importing from the source rather than through discord.js is what
 * lets a command file compile for both targets with no aliasing, no bundler
 * tricks, and no second implementation.
 *
 * The version is pinned to the one discord.js itself depends on, so the classes
 * here are the same classes it would hand back. A drift there would produce
 * two `EmbedBuilder` identities in one process, which fails in a genuinely
 * confusing way.
 *
 * The rule this encodes: **command files import from here, never from
 * `discord.ts`.** Anything that needs the gateway barrel is transport, and
 * belongs in the gateway entry point.
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
  EmbedBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} from '@discordjs/builders'

export {
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SeparatorSpacingSize
} from 'discord-api-types/v10'

export type { APIContainerComponent } from 'discord-api-types/v10'
