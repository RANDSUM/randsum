export const config: {
  token: string
  clientId: string
  guildId: string | undefined
} = {
  token: process.env['DISCORD_TOKEN'] ?? '',
  clientId: process.env['DISCORD_CLIENT_ID'] ?? '',
  guildId: process.env['DISCORD_GUILD_ID']
}

if (!config.token) {
  throw new Error('DISCORD_TOKEN environment variable is required')
}

if (!config.clientId) {
  throw new Error('DISCORD_CLIENT_ID environment variable is required')
}
