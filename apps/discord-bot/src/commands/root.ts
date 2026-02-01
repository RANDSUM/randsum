import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { rollRootRpg } from '@randsum/root-rpg'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

const ROOT_IMAGES = {
  'Strong Hit': 'https://files.randsum.io/root-strong-hit.png',
  'Weak Hit': 'https://files.randsum.io/root-weak-hit.png',
  Miss: 'https://files.randsum.io/root-miss.png'
} as const

export const rootCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('root')
    .setDescription('Roll dice for Root RPG')
    .addIntegerOption(option =>
      option
        .setName('modifier')
        .setDescription('Modifier to add to the roll')
        .setRequired(false)
        .setMinValue(-4)
        .setMaxValue(4)
    ),

  async execute(interaction) {
    const modifier = interaction.options.getInteger('modifier') ?? 0
    const memberNick = interaction.member?.user.username ?? 'Unknown'

    await interaction.deferReply()

    const result = rollRootRpg(modifier)

    // Get initial dice rolls
    const initialRolls = result.rolls[0]?.modifierHistory.initialRolls ?? []

    // Determine color, title, and description based on result
    const resultConfig = {
      'Strong Hit': {
        color: 0x00ff00, // Green
        resultDescription: 'You succeed at your goal'
      },
      'Weak Hit': {
        color: 0xffff00, // Yellow
        resultDescription: 'You succeed, but with a cost or complication'
      },
      Miss: {
        color: 0xff0000, // Red
        resultDescription: "Things don't go your way"
      }
    } as const

    const { color, resultDescription } = resultConfig[result.result]
    const thumbnail = ROOT_IMAGES[result.result]

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${memberNick} rolled a ${result.result}`)
      .setDescription(resultDescription)
      .setThumbnail(thumbnail)
      .setFooter(embedFooterDetails)

    // Add dice rolls
    embed.addFields({
      name: 'Dice Rolls',
      value: initialRolls.join(', '),
      inline: true
    })

    // Add total
    embed.addFields({
      name: 'Total',
      value: String(result.total),
      inline: true
    })

    // Add modifier if present
    if (modifier !== 0) {
      embed.addFields({
        name: 'Modifier',
        value: modifier > 0 ? `+${modifier}` : String(modifier),
        inline: true
      })
    }

    await interaction.editReply({ embeds: [embed] })
  }
}
