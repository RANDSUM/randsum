/**
 * Test preload: resolve discord.js CJS→ESM interop issue.
 *
 * discord.js v14's entry point is CJS with __exportStar re-exports.
 * Bun on Linux can't statically analyze __exportStar for ESM named
 * exports. This preload loads discord.js via require() (which executes
 * the CJS and gets ALL exports) and re-exposes them through mock.module
 * with explicit named exports that Bun can statically resolve.
 *
 * Individual test files then call mock.module('discord.js', ...) again
 * with their own mock factories for assertion purposes.
 */
import { mock } from 'bun:test'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const d = require('discord.js')

// Explicitly re-export every named export used across source files.
// This gives Bun a clear ESM export map to link against.
void mock.module('discord.js', () => ({
  // Builders (from @discordjs/builders via __exportStar)
  ActionRowBuilder: d.ActionRowBuilder,
  ButtonBuilder: d.ButtonBuilder,
  EmbedBuilder: d.EmbedBuilder,
  SlashCommandBuilder: d.SlashCommandBuilder,
  StringSelectMenuBuilder: d.StringSelectMenuBuilder,

  // Enums (from discord-api-types via __exportStar)
  ButtonStyle: d.ButtonStyle,
  ComponentType: d.ComponentType,
  Events: d.Events,
  GatewayIntentBits: d.GatewayIntentBits,
  MessageFlags: d.MessageFlags,

  // Core classes
  Client: d.Client,
  Collection: d.Collection,
  REST: d.REST,
  Routes: d.Routes
}))
