/**
 * Cloudflare Worker entry point — Discord HTTP interactions.
 *
 * The alternative to a gateway bot. Discord POSTs each interaction to this URL
 * and reads the response body; there is no connection to hold open, nothing to
 * reconnect, no session to resume, and no single-instance constraint. The
 * entire class of failure that took the gateway bot offline for an hour on
 * 2026-08-18 — a `client.login()` that hung silently — cannot occur here,
 * because there is no login.
 *
 * The two models are MUTUALLY EXCLUSIVE. Configuring an Interactions Endpoint
 * URL in the Discord application settings stops interaction delivery over the
 * gateway entirely. Do not point Discord at this Worker until it is at parity
 * with the gateway bot — see the status note below.
 */
import { commands as commandList } from '../commands/index.js'
import type { Command } from '../types.js'
import { dispatchInteraction } from './dispatch.js'
import { verifyDiscordRequest } from './verify.js'

export interface Env {
  readonly DISCORD_PUBLIC_KEY: string
}

const commands: ReadonlyMap<string, Command> = new Map(
  commandList.map(command => [command.data.name, command])
)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Read the body ONCE, as text, and verify those exact bytes. Parsing first
    // and re-serializing would change them and break valid signatures.
    const rawBody = await request.text()

    const verified = await verifyDiscordRequest({
      publicKey: env.DISCORD_PUBLIC_KEY,
      signature: request.headers.get('x-signature-ed25519'),
      timestamp: request.headers.get('x-signature-timestamp'),
      rawBody
    })

    // 401 specifically: Discord probes the endpoint with a deliberately invalid
    // signature when you save the URL, and expects to be rejected. An endpoint
    // that accepts anything fails Discord's own validation, which is a rare
    // case of the platform catching the bug for you.
    if (!verified) return new Response('Bad request signature', { status: 401 })

    const payload: unknown = JSON.parse(rawBody)
    if (typeof payload !== 'object' || payload === null) {
      return new Response('Malformed payload', { status: 400 })
    }

    const response = dispatchInteraction(payload as never, commands)
    if (response === undefined) {
      return new Response('Unsupported interaction type', { status: 400 })
    }

    return json(response)
  }
}
