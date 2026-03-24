#!/usr/bin/env node
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { config } from './utils/config.js'
import type { Command } from './types.js'
import { commands as commandList } from './commands/index.js'

// Import events
import { interactionCreateHandler } from './events/interactionCreate.js'
import { guildCreateHandler } from './events/guildCreate.js'

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

// Create a collection to store commands
const commands = new Collection<string, Command>()

for (const command of commandList) {
  commands.set(command.data.name, command)
}

// Attach commands to client
;(client as Client & { commands: Collection<string, Command> }).commands = commands

// Register event handlers - use clientReady (ready is deprecated in v14, removed in v15)
client.once(Events.ClientReady, c => {
  console.warn(`✅ Bot is ready! Logged in as ${c.user.tag}`)
  console.warn(`📊 Serving ${c.guilds.cache.size} servers`)
})

// Wrap async handler to catch unhandled rejections
client.on(Events.InteractionCreate, interaction => {
  void interactionCreateHandler(interaction)
})

client.on(Events.GuildCreate, guild => {
  void guildCreateHandler(guild)
})

// Error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error)
})

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error)
  console.error(error)
})

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error)
  console.error(error)
})

// Graceful shutdown
function shutdown(signal: string): void {
  console.warn(`🛑 ${signal} received, shutting down...`)
  void client.destroy()
  process.exit(0)
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})
process.on('SIGINT', () => {
  shutdown('SIGINT')
})

// Login to Discord
console.warn('🔄 Connecting to Discord...')
try {
  await client.login(config.token)
  console.warn('🔗 Login successful, waiting for ready event...')
} catch (error) {
  console.error('❌ Failed to login:', error)
  process.exit(1)
}
