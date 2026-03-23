import { ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { roll } from '@randsum/roller/roll'
import { notation as createNotation } from '@randsum/roller/validate'
import { suggestNotationFix } from '@randsum/roller'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import type { Command } from '../types.js'

function buildRollEmbed(notationString: string): EmbedBuilder {
  const result = roll(createNotation(notationString))

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`You rolled a ${result.total}`)
    .setDescription(`Rolling: ${notationString}`)
    .setFooter(embedFooterDetails)

  if (result.rolls.length > 0) {
    const rollRecord = result.rolls[0]
    if (rollRecord) {
      const initialRolls = rollRecord.initialRolls
      if (initialRolls.length > 0) {
        embed.addFields({
          name: 'Initial Rolls',
          value: initialRolls.join(', '),
          inline: true
        })
      }
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

  return embed
}

export const rollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Test your luck with a roll of the dice')
    .addStringOption(option =>
      option
        .setName('notation')
        .setDescription('Dice notation (e.g., 2d6+3, d%, 4dF)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const notationString = interaction.options.getString('notation', true)
    await interaction.deferReply()

    try {
      const validNotation = createNotation(notationString)
      const result = roll(validNotation)

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`You rolled a ${result.total}`)
        .setDescription(`Rolling: ${notationString}`)
        .setFooter(embedFooterDetails)

      if (result.rolls.length > 0) {
        const rollRecord = result.rolls[0]
        if (rollRecord) {
          const initialRolls = rollRecord.initialRolls
          if (initialRolls.length > 0) {
            embed.addFields({
              name: 'Initial Rolls',
              value: initialRolls.join(', '),
              inline: true
            })
          }
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

      const row = createRollButton('roll', notationString)
      const response = await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.customId === `reroll:roll:${notationString}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          await i.deferUpdate()
          try {
            const reEmbed = buildRollEmbed(notationString)
            await i.editReply({
              embeds: [reEmbed],
              components: [createRollButton('roll', notationString)]
            })
          } catch {
            await i.editReply({ content: 'An error occurred while re-rolling.' })
          }
        })()
      })

      collector.on('end', () => {
        void (async () => {
          try {
            await interaction.editReply({
              components: [createRollButton('roll', notationString, true)]
            })
          } catch {
            // Message may have been deleted
          }
        })()
      })
    } catch (e) {
      const baseMessage = e instanceof Error ? e.message : 'An unknown error occurred'
      const suggestion = suggestNotationFix(notationString)
      const description = suggestion
        ? `${baseMessage}\n\nDid you mean \`${suggestion}\`?`
        : baseMessage
      await replyWithError(interaction, 'Error', description)
    }
  }
}
