#!/usr/bin/env node
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { config } from './utils/config.js'
import type { Command } from './types.js'

// Import commands
import { bladesCommand } from './commands/blades.js'
import { dhCommand } from './commands/dh.js'
import { notationCommand } from './commands/notation.js'
import { rollCommand } from './commands/roll.js'
import { rootCommand } from './commands/root.js'
import { suCommand } from './commands/su.js'

// Import events
import { interactionCreateHandler } from './events/interactionCreate.js'

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

// Create a collection to store commands
const commands = new Collection<string, Command>()

// Register commands
const commandList = [bladesCommand, dhCommand, notationCommand, rollCommand, rootCommand, suCommand]

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

// Login to Discord
console.warn('🔄 Connecting to Discord...')
try {
  await client.login(config.token)
  console.warn('🔗 Login successful, waiting for ready event...')
} catch (error) {
  console.error('❌ Failed to login:', error)
  process.exit(1)
}
