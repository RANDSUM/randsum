import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/fate'
import type { FateRollResult } from '@randsum/games/fate'
import { embedFooterDetails } from '../utils/constants.js'
import { deferReplyHonoringHidden } from '../utils/ephemeral.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

const SKILL_MIN = -2
const SKILL_MAX = 5

// Keyed by the exported FateRollResult union so the ladder-to-colour map stays
// exhaustive: renaming the result strings (e.g. to snake_case) surfaces here as
// a type error rather than a silent miss.
const ladderColors: Record<FateRollResult, number> = {
  Legendary: 0xffd700,
  Epic: 0xffd700,
  Fantastic: 0x2ecc71,
  Superb: 0x2ecc71,
  Great: 0x2ecc71,
  Good: 0x3498db,
  Fair: 0x3498db,
  Average: 0x95a5a6,
  Mediocre: 0x95a5a6,
  Poor: 0xe67e22,
  Terrible: 0xe74c3c
}

function fateDieSymbol(die: number): string {
  if (die > 0) return '+'
  if (die < 0) return '−'
  return '▢'
}

function buildFateEmbed(skill: number): EmbedBuilder {
  const result = roll({ modifier: skill })
  const dice = result.rolls[0]?.initialRolls ?? []
  const symbols = dice.map(fateDieSymbol).join('  ')

  const embed = new EmbedBuilder()
    .setColor(ladderColors[result.result])
    .setTitle(result.result)
    .setDescription(`Total: ${result.total}`)
    .setFooter(embedFooterDetails)

  embed.addFields({ name: 'Fate Dice (4dF)', value: symbols || 'None', inline: true })

  if (skill !== 0) {
    embed.addFields({
      name: 'Skill',
      value: skill > 0 ? `+${skill}` : String(skill),
      inline: true
    })
  }

  embed.addFields({ name: 'Total', value: String(result.total), inline: true })

  return embed
}

export const fateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('fate')
    .setDescription('Roll 4dF + skill against the Fate ladder (Fate Core)')
    .addIntegerOption(option =>
      option
        .setName('skill')
        .setDescription('Skill rating on the Fate ladder (-2 to +5)')
        .setRequired(false)
        .setMinValue(SKILL_MIN)
        .setMaxValue(SKILL_MAX)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  async execute(interaction) {
    const rawSkill = interaction.options.getInteger('skill') ?? 0
    const skill = Math.max(SKILL_MIN, Math.min(SKILL_MAX, rawSkill))

    await deferReplyHonoringHidden(interaction)

    try {
      const embed = buildFateEmbed(skill)
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
