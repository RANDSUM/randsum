import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/daggerheart'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

interface DhParams {
  readonly modifier: number
  readonly rollingWith: 'Advantage' | 'Disadvantage' | null
  readonly amplifyHope: boolean
  readonly amplifyFear: boolean
}

function buildDhEmbed({ modifier, rollingWith, amplifyHope, amplifyFear }: DhParams): EmbedBuilder {
  const result = roll({
    modifier,
    ...(rollingWith ? { rollingWith } : {}),
    amplifyHope,
    amplifyFear
  })

  const color: number =
    result.result === 'critical hope' ? 0xffd700 : result.result === 'hope' ? 0xffff00 : 0x9b59b6

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(
      `${result.result === 'critical hope' ? 'Critical ' : ''}${result.result === 'fear' ? 'Fear' : 'Hope'}!`
    )
    .setDescription(`Total: ${result.total}`)
    .setFooter(embedFooterDetails)

  const hopeDie = result.details.hope.roll
  embed.addFields({
    name: `Hope Die (${amplifyHope ? 'd20' : 'd12'})`,
    value: String(hopeDie),
    inline: true
  })

  const fearDie = result.details.fear.roll
  embed.addFields({
    name: `Fear Die (${amplifyFear ? 'd20' : 'd12'})`,
    value: String(fearDie),
    inline: true
  })

  if (modifier !== 0) {
    embed.addFields({
      name: 'Modifier',
      value: modifier > 0 ? `+${modifier}` : String(modifier),
      inline: true
    })
  }

  if (rollingWith && result.details.extraDie) {
    const dieRoll =
      rollingWith === 'Advantage'
        ? result.details.extraDie.advantageRoll
        : result.details.extraDie.disadvantageRoll
    embed.addFields({ name: 'Roll Type', value: rollingWith, inline: true })
    embed.addFields({
      name: `${rollingWith} Die (d6)`,
      value: String(dieRoll),
      inline: true
    })
  }

  return embed
}

export const dhCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('dh')
    .setDescription('Roll dice for Daggerheart')
    .addIntegerOption(option =>
      option.setName('modifier').setDescription('Modifier to add to the roll').setRequired(false)
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
    )
    .addBooleanOption(option =>
      option
        .setName('amplify_hope')
        .setDescription('Amplify Hope die (use d20 instead of d12)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('amplify_fear')
        .setDescription('Amplify Fear die (use d20 instead of d12)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const modifier = interaction.options.getInteger('modifier') ?? 0
    const rollingWith = interaction.options.getString('rolling_with') as
      | 'Advantage'
      | 'Disadvantage'
      | null
    const amplifyHope = interaction.options.getBoolean('amplify_hope') ?? false
    const amplifyFear = interaction.options.getBoolean('amplify_fear') ?? false

    await interaction.deferReply()

    try {
      const dhParams: DhParams = { modifier, rollingWith, amplifyHope, amplifyFear }
      const embed = buildDhEmbed(dhParams)
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
