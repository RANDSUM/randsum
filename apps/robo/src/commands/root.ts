import {
  APIEmbed,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder
} from 'discord.js'
import { embedFooterDetails } from '../core/constants'

import { Result, roll } from '@randsum/root-rpg'
import { CommandConfig, CommandOptions, CommandResult } from 'robo.js'

export const config: CommandConfig = {
  description: "The woodland isn't gonna clear itself, vagabond",
  options: [
    {
      name: 'modifier',
      description: 'The number to add to the dice roll',
      type: 'number',
      min: -4,
      max: 4
    }
  ]
}

const getColor = (type: Result): number => {
  switch (type) {
    case 'Strong Hit':
      return Colors.Green
    case 'Weak Hit':
      return Colors.Yellow
    case 'Miss':
      return Colors.Red
  }
}

export const parseRolls = (rolls: number[]): string => {
  return rolls
    .flat()
    .map((roll) => `**${String(roll)}**`)
    .join(', ')
}

const getExplanation = (modifier: number, username: string): string[] => {
  return [`${username} rolled 2d6`, `and added ${String(modifier)}`]
}

const getSuccessString = (type: Result): string[] => {
  switch (type) {
    case 'Strong Hit':
      return [
        '__**Strong Hit**__',
        "*You'll get almost all you wanted, or some additional benefit.*"
      ]
    case 'Weak Hit':
      return [
        '__**Weak Hit**__',
        "*You'll get almost all of what you wanted, but usually with some cost or complication attached.*"
      ]
    case 'Miss':
      return [
        '__**Miss**__',
        '*The GM gets to say what happens next, with an eye towards complicating the situation dramatically.*'
      ]
  }
}

const getThumbnail = (total: number): string => {
  const root =
    'https://raw.githubusercontent.com/RANDSUM/DiscordBot/main/supabase/functions/_shared/assets/root/'

  if (total < -4) {
    return `${root}bigmiss.png`
  }
  if (total > 16) {
    return `${root}bighit.png`
  }
  return `${root}${String(total)}.png`
}

export function handleroll(modifierArg: string, memberNick = 'User'): APIEmbed {
  const modifier = Number(modifierArg)
  const [explanationName, explanationValue] = getExplanation(
    modifier,
    memberNick
  )

  const [hit, result] = roll(modifier)
  const [successTitle, successValue] = getSuccessString(hit)
  const color = getColor(hit)
  const thumbnail = getThumbnail(result.total)

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(successTitle)
    .setDescription(successValue)
    .setThumbnail(thumbnail)
    .addFields({ name: '\u200B', value: '\u200B' })
    .addFields({ name: explanationName, value: explanationValue })
    .addFields({
      name: 'Rolls',
      value: `[${parseRolls(result.history.initialRolls)}] + **${String(modifier)}** = __**${String(result.total)}**__`,
      inline: true
    })
    .setFooter(embedFooterDetails)
    .toJSON()
}

export default async (
  interaction: ChatInputCommandInteraction,
  { modifier }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  await interaction.reply({
    embeds: [handleroll(String(modifier), interaction.user.displayName)]
  })
}
