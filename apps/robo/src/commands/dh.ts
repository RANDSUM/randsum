import type {
  DaggerheartAdvantageDisadvantage,
  DaggerheartRollResult
} from '@randsum/daggerheart'
import { rollDaggerheart } from '@randsum/daggerheart'
import type { APIEmbed, ChatInputCommandInteraction } from 'discord.js'
import { Colors, EmbedBuilder } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { createCommandConfig } from 'robo.js'
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
  rollingWith: DaggerheartAdvantageDisadvantage | undefined
): APIEmbed => {
  const {
    details: { total, type, rolls }
  } = rollDaggerheart({
    modifier: rollModifier,
    rollingWith
  })

  return new EmbedBuilder()
    .setTitle(`You rolled a ${String(total)} with ${type}`)
    .setFields(fields(rolls, rollingWith))
    .setColor(getColor(type))
    .setFooter(embedFooterDetails)
    .toJSON()
}

function fields(
  { hope, fear, modifier, advantage }: DaggerheartRollResult['rolls'],
  rollingWith: DaggerheartAdvantageDisadvantage | undefined
): { name: string; value: string; inline?: boolean | undefined }[] {
  return [
    ...[
      { name: 'Hope', value: hope.toString(), inline: true },
      { name: 'Fear', value: fear.toString(), inline: true }
    ].sort((a, b) => Number(a.value) - Number(b.value)),
    { name: 'Modifier', value: modifier.toString() },
    advantage && rollingWith
      ? {
          name: `Rolled with ${rollingWith}`,
          value: String(advantage)
        }
      : undefined
  ].filter((r) => !!r)
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
      buildEmbed(
        Number(modifier),
        advdis as DaggerheartAdvantageDisadvantage | undefined
      )
    ]
  })
}
