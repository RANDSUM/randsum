/**
 * discord.js barrel — the REST client and the interaction types.
 *
 * This was the *gateway* barrel: `Client`, `Collection`, `Events`,
 * `GatewayIntentBits`, and the builders, imported by a long-lived Node process
 * that held a WebSocket open. That process is gone, and so is everything here
 * that existed to serve it.
 *
 * What remains is the only discord.js that still runs: `REST`/`Routes`, used by
 * `deploy-commands.ts` to write the command registry. The interaction types
 * that sat beside it went with `Command.execute` — nothing narrows a live
 * interaction any more. `deploy-commands` is a one-shot Node script, which is
 * what keeps discord.js out of the Worker bundle entirely.
 *
 * Command files import portable primitives from `builders.ts`, never from here.
 */
export { REST, Routes } from 'discord.js'
