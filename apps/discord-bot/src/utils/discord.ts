/**
 * discord.js re-export wrapper using require().
 *
 * discord.js v14 ships CJS source with __exportStar re-exports from
 * discord-api-types and @discordjs/builders. Bun on Linux cannot
 * statically analyze these for ESM named export detection.
 * require() executes CJS at runtime, discovering all exports.
 */
import type {
  AnyComponentBuilder,
  ActionRowBuilder as _ActionRowBuilder,
  ButtonBuilder as _ButtonBuilder,
  Client as _Client,
  Collection as _Collection,
  ComponentType as _ComponentType,
  EmbedBuilder as _EmbedBuilder,
  Events as _Events,
  GatewayIntentBits as _GatewayIntentBits,
  MessageFlags as _MessageFlags,
  REST as _REST,
  SlashCommandBuilder as _SlashCommandBuilder,
  StringSelectMenuBuilder as _StringSelectMenuBuilder
} from 'discord.js'
import type * as DiscordJS from 'discord.js'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const discord: typeof DiscordJS = require('discord.js')

// Value re-exports — every export needs an explicit type annotation
// for --isolatedDeclarations compatibility.
export const ActionRowBuilder: typeof _ActionRowBuilder = discord.ActionRowBuilder
export const ButtonBuilder: typeof _ButtonBuilder = discord.ButtonBuilder
export const Client: typeof _Client = discord.Client
export const Collection: typeof _Collection = discord.Collection
export const ComponentType: typeof _ComponentType = discord.ComponentType
export const EmbedBuilder: typeof _EmbedBuilder = discord.EmbedBuilder
export const Events: typeof _Events = discord.Events
export const GatewayIntentBits: typeof _GatewayIntentBits = discord.GatewayIntentBits
export const MessageFlags: typeof _MessageFlags = discord.MessageFlags
export const REST: typeof _REST = discord.REST
export const Routes: typeof discord.Routes = discord.Routes
export const SlashCommandBuilder: typeof _SlashCommandBuilder = discord.SlashCommandBuilder
export const StringSelectMenuBuilder: typeof _StringSelectMenuBuilder =
  discord.StringSelectMenuBuilder

// Type re-exports via declaration merging.
// Classes used as generic type arguments or return types need both
// value and type exports under the same name.
export type ActionRowBuilder<T extends AnyComponentBuilder = AnyComponentBuilder> =
  _ActionRowBuilder<T>
export type ButtonBuilder = _ButtonBuilder
export type Client = _Client
export type Collection<K = unknown, V = unknown> = _Collection<K, V>
export type EmbedBuilder = _EmbedBuilder
export type SlashCommandBuilder = _SlashCommandBuilder
export type StringSelectMenuBuilder = _StringSelectMenuBuilder

// Pure type re-exports (compile-time only, no runtime value needed)
export type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Guild,
  Interaction,
  StringSelectMenuInteraction
} from 'discord.js'
