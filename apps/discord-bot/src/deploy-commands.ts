#!/usr/bin/env node
import { RouteBases, Routes } from 'discord-api-types/v10'
import { config } from './utils/config.js'
import { commands as commandList } from './commands/index.js'

const commands = commandList.map(c => c.data.toJSON())

// One bulk-overwrite PUT replaces the whole registry. That is the only REST call
// this app makes, so it is a plain fetch rather than a REST client library.
async function deployCommands(): Promise<void> {
  try {
    console.warn(`Started refreshing ${commands.length} application (/) commands.`)

    // Deploy to guild or globally
    if (config.guildId) {
      console.warn(`Deploying to guild: ${config.guildId}`)
    } else {
      console.warn('Deploying globally')
    }

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId)

    const response = await fetch(`${RouteBases.api}${route}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${config.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordBot (https://github.com/RANDSUM/randsum, 1.0)'
      },
      body: JSON.stringify(commands)
    })

    if (!response.ok) {
      throw new Error(`Discord API ${response.status}: ${await response.text()}`)
    }

    const data: unknown = await response.json()
    const commandCount = Array.isArray(data) ? data.length : 0
    console.warn(`Successfully reloaded ${commandCount} application (/) commands.`)
  } catch (error) {
    console.error('Error deploying commands:', error)
    process.exit(1)
  }
}

await deployCommands()
