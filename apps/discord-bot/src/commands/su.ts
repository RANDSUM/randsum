import { ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { VALID_TABLE_NAMES, roll } from '@randsum/games/salvageunion'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import type { Command } from '../types.js'

function getColor(rollValue: number): number {
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
  return colors[rollValue - 1] ?? 0xffd700
}

function buildSuEmbed(tableName: string): EmbedBuilder {
  const rollResult = roll(tableName)
  const { result } = rollResult
  const color = getColor(result.roll)

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(typeof result.label === 'string' ? result.label : 'Unknown')
    .setDescription(typeof result.description === 'string' ? result.description : '')
    .setFooter(embedFooterDetails)

  embed.addFields(
    { name: 'Table', value: result.tableName, inline: true },
    { name: 'Roll', value: String(result.roll), inline: true }
  )

  return embed
}

export const suCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('su')
    .setDescription('The Salvage Union is here to help you with your salvaging needs')
    .addStringOption(option =>
      option
        .setName('table')
        .setDescription('The table to roll on (default: Core Mechanic)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase()
    const filtered = VALID_TABLE_NAMES.filter(name => name.toLowerCase().includes(focused)).slice(
      0,
      25
    )
    await interaction.respond(filtered.map(name => ({ name, value: name })))
  },

  async execute(interaction) {
    const tableName = interaction.options.getString('table') ?? 'Core Mechanic'

    await interaction.deferReply()

    try {
      const paramsStr = tableName
      const embed = buildSuEmbed(tableName)
      const row = createRollButton('su', paramsStr)
      const response = await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.customId === `reroll:su:${paramsStr}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          await i.deferUpdate()
          try {
            const reEmbed = buildSuEmbed(tableName)
            await i.editReply({
              embeds: [reEmbed],
              components: [createRollButton('su', paramsStr)]
            })
          } catch {
            await i.editReply({ content: 'An error occurred while re-rolling.' })
          }
        })()
      })

      collector.on('end', () => {
        void (async () => {
          try {
            await interaction.editReply({ components: [createRollButton('su', paramsStr, true)] })
          } catch {
            // Message may have been deleted
          }
        })()
      })
    } catch (e) {
      await replyWithError(
        interaction,
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred'
      )
    }
  }
}
