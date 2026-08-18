import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand } from './lib/index.js'
import { commandRegistry } from './lib/registry.js'
import type { Command } from '../types.js'

/**
 * `/help` reads the registry rather than `client.commands`, which is what makes
 * it work on both transports — a Worker has no client to read a registry off.
 * The barrel publishes the list; see `lib/registry.ts` for why it is pushed
 * rather than imported.
 */
export const helpCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available RANDSUM commands')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildEmbed: () => {
    const fields = commandRegistry()
      .filter(command => command.data.name !== 'help')
      .map(command => ({
        name: `/${command.data.name}`,
        value: command.data.description,
        inline: false
      }))

    return new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('RANDSUM Commands')
      .setDescription('Here are all the available commands:')
      .addFields(fields)
      .setFooter(embedFooterDetails)
  }
})
