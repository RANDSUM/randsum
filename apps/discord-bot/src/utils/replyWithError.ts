import type { ChatInputCommandInteraction } from './discord.js'
import { EmbedBuilder } from './builders.js'
import { embedFooterDetails } from './constants.js'

export async function replyWithError(
  interaction: ChatInputCommandInteraction,
  title: string,
  description: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(title)
    .setDescription(description)
    .setFooter(embedFooterDetails)

  await interaction.editReply({ embeds: [embed] })
}
