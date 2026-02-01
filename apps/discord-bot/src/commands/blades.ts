import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { rollBlades } from '@randsum/blades'
import { D6_IMAGES, embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

export const bladesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('blades')
    .setDescription('Roll dice for Blades in the Dark')
    .addIntegerOption(option =>
      option
        .setName('dice')
        .setDescription('Number of dice to roll (0-10)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const dice = interaction.options.getInteger('dice', true)

    await interaction.deferReply()

    const result = rollBlades(dice)

    // Get highest die value from initial rolls
    const initialRolls = result.rolls[0]?.modifierHistory.initialRolls ?? []
    const highestDie = initialRolls.length > 0 ? Math.max(...initialRolls) : 1

    // Determine color and text based on result
    const resultConfig = {
      critical: {
        color: 0xffd700, // Gold
        resultTitle: 'Critical Success!',
        resultDescription: 'Things go better than expected',
        thumbnail: D6_IMAGES.double6
      },
      success: {
        color: 0x00ff00, // Green
        resultTitle: 'Success!',
        resultDescription: 'You succeed at your goal',
        thumbnail: D6_IMAGES[6]
      },
      partial: {
        color: 0xffff00, // Yellow
        resultTitle: 'Partial Success',
        resultDescription: 'You succeed, but with a consequence',
        thumbnail: D6_IMAGES[highestDie as keyof typeof D6_IMAGES]
      },
      failure: {
        color: 0xff0000, // Red
        resultTitle: 'Failure',
        resultDescription: "Things don't go your way",
        thumbnail: D6_IMAGES[highestDie as keyof typeof D6_IMAGES]
      }
    }

    const { color, resultTitle, resultDescription, thumbnail } = resultConfig[result.result]

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(resultTitle)
      .setDescription(resultDescription)
      .setThumbnail(thumbnail)
      .setFooter(embedFooterDetails)

    // Add dice pool information
    embed.addFields({
      name: 'Dice Pool',
      value: dice === 0 ? '0 dice (rolled 2, taking lowest)' : `${dice} dice`,
      inline: true
    })

    // Add highest roll
    embed.addFields({
      name: 'Highest Roll',
      value: String(highestDie),
      inline: true
    })

    // Add all rolls with formatting
    const rollsText = initialRolls.map(r => (r === highestDie ? `**${r}**` : `~~${r}~~`)).join(', ')

    embed.addFields({
      name: 'All Rolls',
      value: rollsText || 'None',
      inline: false
    })

    await interaction.editReply({ embeds: [embed] })
  }
}
