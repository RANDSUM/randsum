import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { notation as createNotation, roll } from '@randsum/roller'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

export const rollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Test your luck with a roll of the dice')
    .addStringOption(option =>
      option.setName('notation').setDescription('Dice notation (e.g., 2d6+3)').setRequired(true)
    ),

  async execute(interaction) {
    const notationString = interaction.options.getString('notation', true)

    await interaction.deferReply()

    // Convert to validated notation - will throw if invalid
    const validNotation = (() => {
      try {
        return createNotation(notationString)
      } catch (_error) {
        // Will be handled below
        return null
      }
    })()

    if (!validNotation) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Invalid Notation')
        .setDescription(
          `The notation "${notationString}" is invalid.\n\n[View notation guide](https://github.com/RANDSUM/randsum/blob/main/packages/roller/GUIDE.md)`
        )
        .setFooter(embedFooterDetails)

      await interaction.editReply({ embeds: [errorEmbed] })
      return
    }

    // Roll the dice
    const result = roll(validNotation)

    // Check for error
    if (result.error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Roll Error')
        .setDescription(`Error: ${result.error.message}`)
        .setFooter(embedFooterDetails)

      await interaction.editReply({ embeds: [errorEmbed] })
      return
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`You rolled a ${result.total}`)
      .setDescription(`Rolling: ${notationString}`)
      .setFooter(embedFooterDetails)

    // Add individual die results if available
    if (result.rolls.length > 0) {
      const rollRecord = result.rolls[0]
      if (rollRecord) {
        // Add initial rolls (before modifiers)
        const initialRolls = rollRecord.modifierHistory.initialRolls
        if (initialRolls.length > 0) {
          embed.addFields({
            name: 'Initial Rolls',
            value: initialRolls.join(', '),
            inline: true
          })
        }

        // Add modified rolls if different from initial
        const modifiedRolls = rollRecord.modifierHistory.modifiedRolls
        if (
          modifiedRolls.length > 0 &&
          JSON.stringify(modifiedRolls) !== JSON.stringify(initialRolls)
        ) {
          embed.addFields({
            name: 'Modified Rolls',
            value: modifiedRolls.join(', '),
            inline: true
          })
        }
      }
    }

    await interaction.editReply({ embeds: [embed] })
  }
}
