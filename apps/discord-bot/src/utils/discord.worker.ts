/**
 * Worker-safe twin of `discord.ts`.
 *
 * `discord.js` proper cannot run on workerd — it is built around a persistent
 * gateway WebSocket, a Node event loop, and Node built-ins, and its maintainers
 * have said plainly it is not intended for HTTP interactions. But the parts the
 * command bodies actually touch are not the gateway parts: the builders live in
 * `@discordjs/builders`, the enums in `discord-api-types`, and the REST client
 * in `@discordjs/rest`. All three are portable.
 *
 * So this barrel re-exports the same *names* as `discord.ts` from those
 * packages, minus the gateway-only ones (`Client`, `Events`,
 * `GatewayIntentBits`, `Collection`) that a Worker has no use for. The Worker
 * build aliases `utils/discord.js` to this file, so every command file keeps
 * its existing import and compiles for both targets unchanged.
 *
 * Keep the exported names in sync with `discord.ts`. A name present there and
 * missing here fails the Worker build — loudly, at build time, which is the
 * right place for it.
 */
export {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} from '@discordjs/builders'

export { ComponentType, MessageFlags, Routes } from 'discord-api-types/v10'

export { REST } from '@discordjs/rest'

export type {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse
} from 'discord-api-types/v10'
