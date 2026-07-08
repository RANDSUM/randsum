import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import type { Client, Collection } from '../utils/discord.js'
import { embedFooterDetails } from '../utils/constants.js'
import { deferReplyHonoringHidden } from '../utils/ephemeral.js'
import type { Command } from '../types.js'

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available RANDSUM commands')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  async execute(interaction) {
    await deferReplyHonoringHidden(interaction)

    const client = interaction.client as Client & { commands: Collection<string, Command> }
    const fields = [...client.commands.values()]
      .filter(cmd => cmd.data.name !== 'help')
      .map(cmd => ({
        name: `/${cmd.data.name}`,
        value: cmd.data.description,
        inline: false
      }))

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('RANDSUM Commands')
      .setDescription('Here are all the available commands:')
      .addFields(fields)
      .setFooter(embedFooterDetails)

    await interaction.editReply({ embeds: [embed] })
  }
}
