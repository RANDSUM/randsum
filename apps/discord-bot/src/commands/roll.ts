import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { notation as createNotation, roll } from '@randsum/roller'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
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
      await replyWithError(
        interaction,
        'Invalid Notation',
        `The notation "${notationString}" is invalid.\n\n[View notation guide](https://github.com/RANDSUM/randsum/blob/main/packages/roller/GUIDE.md)`
      )
      return
    }

    // Roll the dice
    const rollResult = (() => {
      try {
        return { result: roll(validNotation), error: null }
      } catch (e) {
        return { result: null, error: e instanceof Error ? e.message : String(e) }
      }
    })()

    if (rollResult.error !== null) {
      await replyWithError(interaction, 'Roll Error', `Error: ${rollResult.error}`)
      return
    }

    const result = rollResult.result

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
        const initialRolls = rollRecord.initialRolls
        if (initialRolls.length > 0) {
          embed.addFields({
            name: 'Initial Rolls',
            value: initialRolls.join(', '),
            inline: true
          })
        }

        // Add modified rolls if different from initial
        const modifiedRolls = rollRecord.rolls
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
