import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/root-rpg'
import { embedFooterDetails } from '../utils/constants.js'
import { deferReplyHonoringHidden } from '../utils/ephemeral.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

function buildRootEmbed(modifier: number, displayName: string): EmbedBuilder {
  const result = roll({ bonus: modifier })
  const initialRolls = result.rolls[0]?.initialRolls ?? []

  const resultConfig = {
    strong_hit: {
      label: 'Strong Hit',
      color: 0x00ff00,
      resultDescription: 'You succeed at your goal'
    },
    weak_hit: {
      label: 'Weak Hit',
      color: 0xffff00,
      resultDescription: 'You succeed, but with a cost or complication'
    },
    miss: { label: 'Miss', color: 0xff0000, resultDescription: "Things don't go your way" }
  } as const

  const { color, resultDescription, label } = resultConfig[result.result]

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${displayName} rolled a ${label}`)
    .setDescription(resultDescription)
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
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  async execute(interaction) {
    const modifier = interaction.options.getInteger('modifier') ?? 0
    const displayName = interaction.user.displayName

    await deferReplyHonoringHidden(interaction)

    try {
      const embed = buildRootEmbed(modifier, displayName)
      await interaction.editReply({ embeds: [embed] })
    } catch (e) {
      await replyWithError(
        interaction,
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred'
      )
    }
  }
}
