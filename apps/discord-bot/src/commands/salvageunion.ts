import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { deferReplyHonoringHidden } from '../utils/ephemeral.js'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

/**
 * Salvage Union support has moved to the SURef bot from salvageunion.io, which
 * rolls every table *and* looks up chassis, systems, modules, and equipment.
 * This command replaces the old `/su` roller: it no longer rolls, it points.
 * The rename also frees `/su` in servers running both bots — SURef owns that
 * name now.
 */

/** SURef's application id — public by design, it appears in every invite URL. */
const SUREF_CLIENT_ID = '1442878052823470172'
const SUREF_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${SUREF_CLIENT_ID}&scope=bot%20applications.commands&permissions=0`
const SUREF_INFO_URL = 'https://salvageunion.io/discord'

export const salvageUnionCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('salvageunion')
    .setDescription('Salvage Union rolls have moved to the SURef bot from salvageunion.io')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  async execute(interaction) {
    await deferReplyHonoringHidden(interaction)

    const embed = new EmbedBuilder()
      .setColor(0xb7410e)
      .setTitle('Salvage Union has moved')
      .setDescription(
        'RANDSUM no longer rolls Salvage Union tables. **SURef**, the official bot from salvageunion.io, does it better — every table, plus lookups for any chassis, system, module, or piece of equipment, linked back to the full SRD entry.'
      )
      .addFields(
        { name: 'Add SURef to your server', value: `[Invite the bot](${SUREF_INVITE_URL})` },
        { name: 'Learn more', value: `[salvageunion.io/discord](${SUREF_INFO_URL})` }
      )
      .setFooter(embedFooterDetails)

    await interaction.editReply({ embeds: [embed] })
  }
}
