import type { Client } from 'discord.js'

export function readyHandler(client: Client<true>): void {
  console.warn(`✅ Bot is ready! Logged in as ${client.user.tag}`)
  console.warn(`📊 Serving ${client.guilds.cache.size} servers`)
}
