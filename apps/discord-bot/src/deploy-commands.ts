#!/usr/bin/env node
import { REST, Routes } from 'discord.js'
import { config } from './utils/config.js'
import { commands as commandList } from './commands/index.js'

const commands = commandList.map(c => c.data.toJSON())

const rest = new REST().setToken(config.token)

async function deployCommands(): Promise<void> {
  try {
    console.warn(`Started refreshing ${commands.length} application (/) commands.`)

    // Deploy to guild or globally
    if (config.guildId) {
      console.warn(`Deploying to guild: ${config.guildId}`)
    } else {
      console.warn('Deploying globally')
    }

    const data: unknown = config.guildId
      ? await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
          body: commands
        })
      : await rest.put(Routes.applicationCommands(config.clientId), { body: commands })

    const commandCount = Array.isArray(data) ? data.length : 0
    console.warn(`Successfully reloaded ${commandCount} application (/) commands.`)
  } catch (error) {
    console.error('Error deploying commands:', error)
    process.exit(1)
  }
}

await deployCommands()
