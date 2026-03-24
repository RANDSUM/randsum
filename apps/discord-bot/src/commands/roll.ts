import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder
} from 'discord.js'
import { roll } from '@randsum/roller/roll'
import { notation as createNotation } from '@randsum/roller/validate'
import { suggestNotationFix } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import { formatTraceSteps } from '../utils/traceFormatter.js'
import type { Command } from '../types.js'
import type { RollerRollResult } from '@randsum/roller'

function buildEmbedFromResult(notationString: string, result: RollerRollResult): EmbedBuilder {
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

function buildRollEmbed(notationString: string): EmbedBuilder {
  const result = roll(createNotation(notationString))
  return buildEmbedFromResult(notationString, result)
}

function createShowWorkButton(notation: string): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(`showwork:${notation}`)
    .setLabel('Show Work')
    .setStyle(2) // ButtonStyle.Secondary

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
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
      const embed = buildEmbedFromResult(notationString, result)

      const components: ActionRowBuilder<ButtonBuilder>[] = [
        createRollButton('roll', notationString)
      ]

      const rollRecord = result.rolls[0]
      if (rollRecord) {
        const steps = traceRoll(rollRecord)
        if (steps.length > 1) {
          components.push(createShowWorkButton(notationString))
        }
      }

      const response = await interaction.editReply({ embeds: [embed], components })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i =>
          i.customId === `reroll:roll:${notationString}` ||
          i.customId === `showwork:${notationString}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          if (i.customId === `showwork:${notationString}`) {
            try {
              const reResult = roll(createNotation(notationString))
              const firstRecord = reResult.rolls[0]
              if (firstRecord) {
                const traceSteps = traceRoll(firstRecord)
                const traceText = formatTraceSteps(traceSteps)
                const traceEmbed = new EmbedBuilder()
                  .setColor('#9B59B6')
                  .setTitle('How it was rolled')
                  .setDescription(traceText)
                  .setFooter(embedFooterDetails)
                await i.reply({ embeds: [traceEmbed], ephemeral: true })
              }
            } catch {
              await i.reply({
                content: 'An error occurred while tracing the roll.',
                ephemeral: true
              })
            }
            return
          }

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
