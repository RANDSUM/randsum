import { EmbedBuilder } from '../utils/discord.js'
import type { Guild } from '../utils/discord.js'
import { embedFooterDetails } from '../utils/constants.js'

export async function guildCreateHandler(guild: Guild): Promise<void> {
  if (guild.systemChannel === null) return

  const embed = new EmbedBuilder()
    .setColor('#A855F7')
    .setTitle('Welcome to RANDSUM!')
    .setDescription(
      'RANDSUM — Roll dice for your TTRPG sessions\n\nKey commands:\n`/roll` — Roll any dice notation\n`/notation` — Browse the notation reference\n`/blades`, `/dh`, `/fifth`, `/pbta`, `/root`, `/su` — Game-specific rolls\n`/help` — List all commands\n\nLearn the full dice notation spec at https://notation.randsum.dev'
    )
    .setFooter(embedFooterDetails)

  await guild.systemChannel.send({ embeds: [embed] })
}
