import { ComponentType, EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/fifth'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import type { Command } from '../types.js'

interface FifthParams {
  readonly modifier: number
  readonly rollingWith: 'Advantage' | 'Disadvantage' | null
}

function buildFifthEmbed({ modifier, rollingWith }: FifthParams): EmbedBuilder {
  const result = roll({
    modifier,
    crit: true,
    ...(rollingWith ? { rollingWith } : {})
  })

  const initialRolls = result.rolls[0]?.initialRolls ?? []
  const criticals = result.details.criticals
  const isNat20 = criticals?.isNatural20 === true
  const isNat1 = criticals?.isNatural1 === true

  const embedColor = isNat20 ? 0xffd700 : isNat1 ? 0xdc143c : 0x1e90ff
  const titlePrefix = isNat20 ? 'Natural 20! ' : isNat1 ? 'Natural 1! ' : ''

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`${titlePrefix}D&D 5e Roll: ${result.total}`)
    .setDescription(rollingWith ? `Rolled with ${rollingWith}` : 'Standard roll')
    .setFooter(embedFooterDetails)

  const rollsText =
    rollingWith && initialRolls.length > 1
      ? initialRolls
          .map(r => {
            const kept =
              rollingWith === 'Advantage'
                ? r === Math.max(...initialRolls)
                : r === Math.min(...initialRolls)
            return kept ? `**${r}**` : `~~${r}~~`
          })
          .join(', ')
      : initialRolls.join(', ')

  embed.addFields({
    name: rollingWith ? 'Dice Rolled (2d20)' : 'Die Rolled (1d20)',
    value: rollsText || 'None',
    inline: true
  })

  if (modifier !== 0) {
    embed.addFields({
      name: 'Modifier',
      value: modifier > 0 ? `+${modifier}` : String(modifier),
      inline: true
    })
  }

  embed.addFields({ name: 'Total', value: String(result.total), inline: true })

  return embed
}

export const fifthCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('fifth')
    .setDescription('Roll dice for D&D 5th Edition (1d20 + modifier)')
    .addIntegerOption(option =>
      option
        .setName('modifier')
        .setDescription('Modifier to add to the roll (-30 to 30)')
        .setRequired(false)
        .setMinValue(-30)
        .setMaxValue(30)
    )
    .addStringOption(option =>
      option
        .setName('rolling_with')
        .setDescription('Roll with advantage or disadvantage')
        .setRequired(false)
        .addChoices(
          { name: 'Advantage', value: 'Advantage' },
          { name: 'Disadvantage', value: 'Disadvantage' }
        )
    ),

  async execute(interaction) {
    const modifier = interaction.options.getInteger('modifier') ?? 0
    const rollingWith = interaction.options.getString('rolling_with') as
      | 'Advantage'
      | 'Disadvantage'
      | null

    await interaction.deferReply()

    try {
      const params: FifthParams = { modifier, rollingWith }
      const paramsStr = JSON.stringify({ modifier, ...(rollingWith ? { rollingWith } : {}) })
      const embed = buildFifthEmbed(params)
      const row = createRollButton('fifth', paramsStr)
      const response = await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.customId === `reroll:fifth:${paramsStr}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          await i.deferUpdate()
          try {
            const reEmbed = buildFifthEmbed(params)
            await i.editReply({
              embeds: [reEmbed],
              components: [createRollButton('fifth', paramsStr)]
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
              components: [createRollButton('fifth', paramsStr, true)]
            })
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
