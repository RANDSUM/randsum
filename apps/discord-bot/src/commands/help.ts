import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'
import { bladesCommand } from './blades.js'
import { dhCommand } from './dh.js'
import { fifthCommand } from './fifth.js'
import { notationCommand } from './notation.js'
import { pbtaCommand } from './pbta.js'
import { rollCommand } from './roll.js'
import { rootCommand } from './root.js'
import { suCommand } from './su.js'

const listedCommands: readonly Command[] = [
  rollCommand,
  notationCommand,
  bladesCommand,
  dhCommand,
  fifthCommand,
  pbtaCommand,
  rootCommand,
  suCommand
]

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available RANDSUM commands'),

  async execute(interaction) {
    await interaction.deferReply()

    const fields = listedCommands.map(cmd => ({
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
