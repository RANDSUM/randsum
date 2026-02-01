import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { SALVAGE_UNION_TABLE_NAMES, rollTable } from '@randsum/salvageunion'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

function getColor(roll: number): number {
  const colors = [
    0x8b0000, // 1 - Dark red
    0xa52a2a, // 2
    0xb22222, // 3
    0xdc143c, // 4
    0xff0000, // 5
    0xff4500, // 6
    0xff6347, // 7
    0xff7f50, // 8
    0xffa500, // 9
    0xffd700, // 10 - Gold
    0xffff00, // 11
    0xadff2f, // 12
    0x9acd32, // 13
    0x7cfc00, // 14
    0x7fff00, // 15
    0x00ff00, // 16
    0x00ff7f, // 17
    0x00fa9a, // 18
    0x00ced1, // 19
    0x00ff00 // 20 - Green
  ]
  return colors[roll - 1] ?? 0xffd700
}

const tableChoices = SALVAGE_UNION_TABLE_NAMES.map(name => ({
  name,
  value: name
}))

export const suCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('su')
    .setDescription('The Salvage Union is here to help you with your salvaging needs')
    .addStringOption(option =>
      option
        .setName('table')
        .setDescription('The table to roll on')
        .setRequired(false)
        .addChoices(...tableChoices)
    ),

  async execute(interaction) {
    const tableName = interaction.options.getString('table') ?? 'Core Mechanic'

    await interaction.deferReply()

    const rollResult = rollTable(tableName)
    const color = getColor(rollResult.result.roll)

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(rollResult.result.label)
      .setDescription(rollResult.result.description)
      .setFooter(embedFooterDetails)

    embed.addFields(
      {
        name: 'Table',
        value: rollResult.result.tableName,
        inline: true
      },
      {
        name: 'Roll',
        value: String(rollResult.result.roll),
        inline: true
      }
    )

    await interaction.editReply({ embeds: [embed] })
  }
}
