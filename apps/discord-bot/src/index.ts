#!/usr/bin/env node
import { Client, Collection, Events, GatewayIntentBits } from './utils/discord.js'
import { config } from './utils/config.js'
import type { Command } from './types.js'
import { commands as commandList } from './commands/index.js'
import { logger } from './utils/logger.js'
import { flushMetrics, startMetricsFlush, stopMetricsFlush } from './utils/metrics.js'
import { captureException, initErrorTracker } from './utils/errorTracker.js'
import { loginWithBackoff } from './utils/loginWithBackoff.js'

// Import events
import { interactionCreateHandler } from './events/interactionCreate.js'
import { guildCreateHandler } from './events/guildCreate.js'

// Initialize observability before anything else can throw.
initErrorTracker()
startMetricsFlush()

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
  logger.info('bot.ready', {
    tag: c.user.tag,
    guilds: c.guilds.cache.size
  })
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
  captureException(error, { phase: 'client.error' })
})

process.on('unhandledRejection', error => {
  captureException(error, { phase: 'unhandledRejection' })
})

process.on('uncaughtException', error => {
  captureException(error, { phase: 'uncaughtException' })
})

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info('bot.shutdown', { signal })
  flushMetrics()
  stopMetricsFlush()
  void client.destroy()
  process.exit(0)
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})
process.on('SIGINT', () => {
  shutdown('SIGINT')
})

// Login to Discord with capped exponential backoff so a transient outage at
// boot does not immediately exit, and a misconfigured auth does not produce a
// tight restart-crash loop under Render's auto-restart.
logger.info('bot.connecting')
try {
  await loginWithBackoff(() => client.login(config.token))
  logger.info('bot.login_succeeded')
} catch (error) {
  captureException(error, { phase: 'login' })
  flushMetrics()
  process.exit(1)
}
