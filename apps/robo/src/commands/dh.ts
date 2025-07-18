import type { APIEmbed, ChatInputCommandInteraction } from 'discord.js'
import { Colors, EmbedBuilder } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'
import type {
  DaggerheartAdvantageDisadvantage,
  DaggerheartRollResult,
  DaggerheartRollResultType
} from '@randsum/daggerheart'
import { rollDaggerheart } from '@randsum/daggerheart'

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
      name: 'rollingwith',
      description: 'Roll with advantage or disadvantage',
      type: 'string',
      required: false,
      choices: [
        { name: 'Advantage', value: 'Advantage' },
        { name: 'Disadvantage', value: 'Disadvantage' }
      ]
    },
    {
      name: 'amplifyhope',
      description: 'Use d20 instead of d12 for Hope die',
      type: 'boolean',
      required: false
    },
    {
      name: 'amplifyfear',
      description: 'Use d20 instead of d12 for Fear die',
      type: 'boolean',
      required: false
    }
  ]
})

const buildEmbed = (
  rollModifier: number,
  rollingWith: DaggerheartAdvantageDisadvantage | undefined = undefined,
  amplifyHope: boolean,
  amplifyFear: boolean
): APIEmbed => {
  const {
    type,
    result,
    baseResult: { rolls }
  } = rollDaggerheart({
    modifier: rollModifier,
    rollingWith,
    amplifyHope,
    amplifyFear
  })

  return new EmbedBuilder()
    .setTitle(`You rolled a ${String(result)} with ${type}`)
    .setFields(fields(rolls, rollingWith))
    .setColor(getColor(type))
    .setFooter(embedFooterDetails)
    .toJSON()
}

function fields(
  {
    hope,
    fear,
    modifier = 0,
    advantage,
    amplifyHope,
    amplifyFear
  }: DaggerheartRollResult['rolls'],
  rollingwith: DaggerheartAdvantageDisadvantage | undefined
): { name: string; value: string; inline?: boolean | undefined }[] {
  return [
    ...[
      { name: 'Hope', value: hope.toString(), inline: true },
      { name: 'Fear', value: fear.toString(), inline: true }
    ].sort((a, b) => Number(a.value) - Number(b.value)),
    { name: 'Modifier', value: String(modifier) },
    advantage && rollingwith
      ? {
          name: `Rolled with ${rollingwith}`,
          value: String(advantage)
        }
      : undefined,
    amplifyHope
      ? { name: 'Amplified Hope', value: 'Hope rolled with d20 instead of d12' }
      : undefined,
    amplifyFear
      ? { name: 'Amplified Fear', value: 'Fear rolled with d20 instead of d12' }
      : undefined
  ].filter((r) => !!r)
}

function getColor(type: DaggerheartRollResultType): number {
  switch (type) {
    case 'hope':
      return Colors.Yellow
    case 'fear':
      return Colors.Purple
    case 'critical hope':
      return Colors.Gold
  }
}

export default async (
  interaction: ChatInputCommandInteraction,
  {
    modifier,
    rollingwith,
    amplifyhope,
    amplifyfear
  }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  await interaction.reply({
    embeds: [
      buildEmbed(
        modifier ? Number(modifier) : 0,
        rollingwith
          ? (rollingwith as DaggerheartAdvantageDisadvantage)
          : undefined,
        amplifyhope ? Boolean(amplifyhope) : false,
        amplifyfear ? Boolean(amplifyfear) : false
      )
    ]
  })
}
