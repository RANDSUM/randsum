import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { roll } from '@randsum/games/daggerheart'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, formatSignedModifier } from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command } from '../types.js'

function buildDhEmbed(context: CommandContext): EmbedBuilder {
  const modifier = context.options.getInteger('modifier') ?? 0
  const rollingWith = context.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null
  const amplifyHope = context.options.getBoolean('amplify_hope') ?? false
  const amplifyFear = context.options.getBoolean('amplify_fear') ?? false

  const result = roll({
    modifier,
    ...(rollingWith ? { rollingWith } : {}),
    amplifyHope,
    amplifyFear
  })

  const color: number =
    result.result === 'critical_hope' ? 0xffd700 : result.result === 'hope' ? 0xffff00 : 0x9b59b6

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(
      `${result.result === 'critical_hope' ? 'Critical ' : ''}${result.result === 'fear' ? 'Fear' : 'Hope'}!`
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
      value: formatSignedModifier(modifier),
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

export const dhCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('dh')
    .setDescription('Roll dice for Daggerheart')
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
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildEmbed: buildDhEmbed
})
