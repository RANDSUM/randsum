import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { rollDaggerheart } from '@randsum/daggerheart'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

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

    const result = rollDaggerheart({
      modifier,
      ...(rollingWith ? { rollingWith } : {}),
      amplifyHope,
      amplifyFear
    })

    // Determine color based on result type
    const color: number =
      result.result === 'critical hope'
        ? 0xffd700 // Gold
        : result.result === 'hope'
          ? 0xffff00 // Yellow
          : 0x9b59b6 // Purple (fear)

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(
        `${result.result === 'critical hope' ? 'Critical ' : ''}${result.result === 'fear' ? 'Fear' : 'Hope'}!`
      )
      .setDescription(`Total: ${result.total}`)
      .setFooter(embedFooterDetails)

    // Add hope die
    const hopeDie = result.details?.hope.roll ?? 0
    embed.addFields({
      name: `Hope Die (${amplifyHope ? 'd20' : 'd12'})`,
      value: String(hopeDie),
      inline: true
    })

    // Add fear die
    const fearDie = result.details?.fear.roll ?? 0
    embed.addFields({
      name: `Fear Die (${amplifyFear ? 'd20' : 'd12'})`,
      value: String(fearDie),
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

    // Add advantage/disadvantage info if present
    if (rollingWith && result.details?.advantage) {
      embed.addFields({
        name: 'Roll Type',
        value: rollingWith,
        inline: true
      })
      embed.addFields({
        name: `${rollingWith} Die (d6)`,
        value: String(result.details.advantage.roll),
        inline: true
      })
    }

    await interaction.editReply({ embeds: [embed] })
  }
}
