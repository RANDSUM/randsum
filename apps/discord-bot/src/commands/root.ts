import { ComponentType, EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/root-rpg'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import type { Command } from '../types.js'

const ROOT_IMAGES = {
  'Strong Hit': 'https://files.randsum.io/root-strong-hit.png',
  'Weak Hit': 'https://files.randsum.io/root-weak-hit.png',
  Miss: 'https://files.randsum.io/root-miss.png'
} as const

function buildRootEmbed(modifier: number, memberNick: string): EmbedBuilder {
  const result = roll(modifier)
  const initialRolls = result.rolls[0]?.initialRolls ?? []

  const resultConfig = {
    'Strong Hit': { color: 0x00ff00, resultDescription: 'You succeed at your goal' },
    'Weak Hit': {
      color: 0xffff00,
      resultDescription: 'You succeed, but with a cost or complication'
    },
    Miss: { color: 0xff0000, resultDescription: "Things don't go your way" }
  } as const

  const { color, resultDescription } = resultConfig[result.result]
  const thumbnail = ROOT_IMAGES[result.result]

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${memberNick} rolled a ${result.result}`)
    .setDescription(resultDescription)
    .setThumbnail(thumbnail)
    .setFooter(embedFooterDetails)

  embed.addFields({ name: 'Dice Rolls', value: initialRolls.join(', '), inline: true })
  embed.addFields({ name: 'Total', value: String(result.total), inline: true })

  if (modifier !== 0) {
    embed.addFields({
      name: 'Modifier',
      value: modifier > 0 ? `+${modifier}` : String(modifier),
      inline: true
    })
  }

  return embed
}

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

    try {
      const paramsStr = String(modifier)
      const embed = buildRootEmbed(modifier, memberNick)
      const row = createRollButton('root', paramsStr)
      const response = await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.customId === `reroll:root:${paramsStr}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          await i.deferUpdate()
          try {
            const reEmbed = buildRootEmbed(modifier, memberNick)
            await i.editReply({
              embeds: [reEmbed],
              components: [createRollButton('root', paramsStr)]
            })
          } catch {
            await i.editReply({ content: 'An error occurred while re-rolling.' })
          }
        })()
      })

      collector.on('end', () => {
        void (async () => {
          try {
            await interaction.editReply({ components: [createRollButton('root', paramsStr, true)] })
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
