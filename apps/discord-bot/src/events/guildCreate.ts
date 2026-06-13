import { EmbedBuilder } from '../utils/discord.js'
import type { Guild } from '../utils/discord.js'
import { embedFooterDetails } from '../utils/constants.js'
import { captureException } from '../utils/errorTracker.js'

export async function guildCreateHandler(guild: Guild): Promise<void> {
  if (guild.systemChannel === null) return

  const embed = new EmbedBuilder()
    .setColor('#A855F7')
    .setTitle('Welcome to RANDSUM!')
    .setDescription(
      'RANDSUM — Roll dice for your TTRPG sessions\n\nKey commands:\n`/roll` — Roll any dice notation\n`/notation` — Browse the notation reference\n`/blades`, `/dh`, `/fifth`, `/pbta`, `/root`, `/su` — Game-specific rolls\n`/help` — List all commands\n\nLearn the full dice notation spec at https://notation.randsum.dev'
    )
    .setFooter(embedFooterDetails)

  try {
    await guild.systemChannel.send({ embeds: [embed] })
  } catch (error) {
    // Log and degrade: a missing-permissions error on join should not crash the
    // bot nor fall through to the global unhandledRejection net. There is no
    // interaction to reply to, so we capture and silently skip the welcome.
    captureException(error, {
      phase: 'guildCreate.welcome',
      guildId: guild.id
    })
  }
}
