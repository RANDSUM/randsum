import { AdvantageDisadvantage, roll } from '@randsum/daggerheart'
import {
  APIEmbed,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder
} from 'discord.js'
import { CommandOptions, CommandResult, createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'

export const config = createCommandConfig({
  description: 'What moves you - Hope, or Fear?',
  options: [
    {
      name: 'modifier',
      description: 'Additional Modifier to be added to the roll',
      type: 'number',
      required: false
    },
    {
      name: 'advdis',
      description: 'Roll with advantage or disadvantage',
      type: 'string',
      required: false
    }
  ]
})

const buildEmbed = (
  rollModifier: number,
  rollingWith: AdvantageDisadvantage | undefined
): APIEmbed => {
  const {
    total,
    type,
    rolls: { hope, fear, modifier, advantage }
  } = roll({ modifier: rollModifier, rollingWith })

  const hopeFearFields = [
    { name: 'Hope', value: hope.toString(), inline: true },
    { name: 'Fear', value: fear.toString(), inline: true }
  ].sort((a, b) => Number(a.value) - Number(b.value))

  const fields = [
    ...hopeFearFields,
    { name: 'Modifier', value: modifier.toString() },
    advantage &&
    rollingWith && {
      name: `Rolled with ${rollingWith}`,
      value: advantage.toString()
    }
  ].filter((r) => !!r)
  return new EmbedBuilder()
    .setTitle(`You rolled a ${String(total)} with ${type}`)
    .setFields(fields)
    .setColor(getColor(type))
    .setFooter(embedFooterDetails)
    .toJSON()
}

function getColor(type: 'hope' | 'fear' | 'critical hope'): number {
  switch (type) {
    case 'hope':
      return Colors.White
    case 'fear':
      return Colors.NotQuiteBlack
    case 'critical hope':
      return Colors.Gold
  }
}

export default async (
  interaction: ChatInputCommandInteraction,
  { modifier, advdis }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  await interaction.reply({
    embeds: [
      buildEmbed(Number(modifier), advdis as AdvantageDisadvantage | undefined)
    ]
  })
}
