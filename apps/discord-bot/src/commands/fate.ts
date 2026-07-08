import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/fate'
import type { FateRollResult } from '@randsum/games/fate'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, formatSignedModifier, getInitialRolls } from './lib/index.js'
import type { ChatInputCommandInteraction } from '../utils/discord.js'
import type { Command } from '../types.js'

const SKILL_MIN = -2
const SKILL_MAX = 5

// Keyed by the exported FateRollResult union so the ladder map stays
// exhaustive: renaming the result strings surfaces here as a type error
// rather than a silent miss. `label` is the human-readable ladder rung shown
// to the player; the result strings themselves are snake_case.
const ladder: Record<FateRollResult, { readonly color: number; readonly label: string }> = {
  legendary: { color: 0xffd700, label: 'Legendary' },
  epic: { color: 0xffd700, label: 'Epic' },
  fantastic: { color: 0x2ecc71, label: 'Fantastic' },
  superb: { color: 0x2ecc71, label: 'Superb' },
  great: { color: 0x2ecc71, label: 'Great' },
  good: { color: 0x3498db, label: 'Good' },
  fair: { color: 0x3498db, label: 'Fair' },
  average: { color: 0x95a5a6, label: 'Average' },
  mediocre: { color: 0x95a5a6, label: 'Mediocre' },
  poor: { color: 0xe67e22, label: 'Poor' },
  terrible: { color: 0xe74c3c, label: 'Terrible' }
}

function fateDieSymbol(die: number): string {
  if (die > 0) return '+'
  if (die < 0) return '−'
  return '▢'
}

function buildFateEmbed(interaction: ChatInputCommandInteraction): EmbedBuilder {
  const rawSkill = interaction.options.getInteger('skill') ?? 0
  const skill = Math.max(SKILL_MIN, Math.min(SKILL_MAX, rawSkill))

  const result = roll({ modifier: skill })
  const dice = getInitialRolls(result)
  const symbols = dice.map(fateDieSymbol).join('  ')

  const embed = new EmbedBuilder()
    .setColor(ladder[result.result].color)
    .setTitle(ladder[result.result].label)
    .setDescription(`Total: ${result.total}`)
    .setFooter(embedFooterDetails)

  embed.addFields({ name: 'Fate Dice (4dF)', value: symbols || 'None', inline: true })

  if (skill !== 0) {
    embed.addFields({
      name: 'Skill',
      value: formatSignedModifier(skill),
      inline: true
    })
  }

  embed.addFields({ name: 'Total', value: String(result.total), inline: true })

  return embed
}

export const fateCommand: Command = createGameCommand({
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
  buildEmbed: buildFateEmbed
})
