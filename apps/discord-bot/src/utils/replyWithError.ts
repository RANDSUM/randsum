import type { ChatInputCommandInteraction } from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import { embedFooterDetails } from './constants.js'

export async function replyWithError(
  interaction: ChatInputCommandInteraction,
  title: string,
  description: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(title)
    .setDescription(description)
    .setFooter(embedFooterDetails)

  await interaction.editReply({ embeds: [embed] })
}
