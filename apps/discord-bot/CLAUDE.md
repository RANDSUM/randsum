# @randsum/discord-bot — RANDSUM Discord Bot

## Overview

Private Discord bot that exposes RANDSUM dice mechanics as slash commands. Depends on
`@randsum/games` (for game-specific rolls) and `@randsum/roller` (for generic notation rolls).
Never published to npm.

**It is a Cloudflare Worker serving HTTP interactions.** Discord POSTs each interaction to
`https://bot.randsum.dev/` and reads the response body. There is no connection to hold open,
nothing to reconnect, no session to resume, and no single-instance constraint.

The discord.js **gateway bot is gone** — removed 2026-09-01 along with Render, the only host it
ever ran on. If you are reading older commentary that describes `src/index.ts`, a login backoff,
a shard watchdog or a 5-minute heartbeat, that code no longer exists. There is no second
transport and no fallback.

This app has **no `build` script**: wrangler compiles `src/worker/index.ts` itself, so there is no
artifact to produce ahead of a deploy. It is listed in `BUILD_EXEMPT` in
`scripts/check-workspace-scripts.ts` for exactly that reason.

## Directory Structure

```
apps/discord-bot/
  src/
    deploy-commands.ts   # One-shot Node script: writes the slash command registry
    types.ts             # Command interface (data, execute, buildEmbed, buildComponents)
    worker/
      index.ts           # Worker entry: verifies the signature, dispatches, responds
      verify.ts          # Ed25519 request-signature verification (WebCrypto)
      dispatch.ts        # Pure interaction payload -> response payload. No I/O.
    commands/
      index.ts           # Command barrel — single source of truth for all commands
      blades.ts          # /blades — Blades in the Dark (rating 0-10)
      dh.ts              # /dh — Daggerheart
      fate.ts            # /fate — Fate Core
      fifth.ts           # /fifth — D&D 5e (with critical hit/miss display)
      help.ts            # /help — lists all available commands
      notation.ts        # /notation — live docs from @randsum/roller/docs, paginated by category
      pbta.ts            # /pbta — Powered by the Apocalypse
      roll.ts            # /roll — generic notation roller
      root.ts            # /root — Root RPG
      salvageunion.ts    # /salvageunion — pointer to the SURef bot (rolls nothing)
      lib/               # Shared command scaffolding (context, notation view, factory)
    utils/
      builders.ts        # PORTABLE Discord primitives — safe on workerd. Commands import here.
      discord.ts         # discord.js REST barrel — deploy-commands only, never the Worker
      config.ts          # Reads env vars; throws on missing required vars (deploy-commands only)
      constants.ts       # D6 die face image URLs, embed footer
      replyWithError.ts  # Shared error embed helper
      ephemeral.ts       # Ephemeral-reply flag helper
      logger.ts          # Structured logging
      errorTracker.ts    # Error capture/reporting
```

The `builders.ts` / `discord.ts` split is load-bearing and outlived the gateway. Command files
import builders and enums from `builders.ts`, which re-exports `@discordjs/builders` and
`discord-api-types` — ordinary portable packages that run on workerd. `discord.ts` is the real
discord.js, reachable only from `deploy-commands.ts` (a Node script) and from type-only imports
that erase at compile time. That is what keeps discord.js out of the Worker bundle.

## Commands

```bash
bun run dev              # wrangler dev — run the Worker locally
bun run deploy-commands  # Write the slash command registry (see below — now required)
bun run typecheck        # tsc --noEmit
bun run lint             # Biome lint
bun run format           # Biome format
bun run check            # typecheck + format:check + lint + test
```

There is no `build` or `start`. Both existed only to bundle and run the Node gateway process.

## Environment Variables

**The Worker needs none of these.** They are read by `config.ts`, which only
`deploy-commands.ts` imports.

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `DISCORD_TOKEN`     | Yes      | Bot token from Discord Developer Portal                                     |
| `DISCORD_CLIENT_ID` | Yes      | Application (client) ID                                                     |
| `DISCORD_GUILD_ID`  | No       | If set, registers commands to that guild only (instant propagation for dev) |

`config.ts` throws if `DISCORD_TOKEN` or `DISCORD_CLIENT_ID` are missing.

The Worker's only input is `DISCORD_PUBLIC_KEY`, a committed `var` in `wrangler.jsonc` — not a
secret. It verifies Discord's signatures and cannot produce one, so the threat model is backwards
from a token's. HTTP interactions are authenticated by request signature rather than a bot
session, which is why the most sensitive credential in this app is simply not deployed.

## Error Tracking

`captureException` (`src/utils/errorTracker.ts`) emits one structured log line with
per-interaction correlation context. That is all it does.

**Remote delivery was removed with Render.** The module used to speak Sentry's envelope protocol
over plain `fetch` and post to a Discord webhook, configured by `SENTRY_DSN` and
`DISCORD_ERROR_WEBHOOK_URL` — Render dashboard variables, initialized by the gateway process's
`initErrorTracker()` call. All of it was unrunnable on workerd regardless: it read `process.env`,
and `flushErrorTracker()` existed to drain in-flight sends before a deliberate `process.exit`,
which a Worker has no concept of.

**Cloudflare Workers Observability** (enabled in `wrangler.jsonc`) is the error surface now, and
it ingests exactly what this emits. `/notation` is the only caller.

The seam is kept rather than inlined into its call site so that re-adding delivery stays a change
to this module's body with no call site touched — but it would have to read config from the
Worker's `env` argument, not from `process`.

Capturing any shape of error — an `Error`, a string, `undefined` — does not throw, so a tracker
problem cannot become an outage. One inherited exception: `logger` serializes with
`JSON.stringify`, so a context object holding a circular reference throws at the log call. No
caller passes one.

## Deployment

`.github/workflows/deploy-cloudflare.yml` deploys `apps/discord-bot/wrangler.jsonc` on merge to
`main`. Operational detail — triage, rollback, DR — lives in `apps/DEPLOY.md`.

- `bot.randsum.dev` is declared in `routes` as a `custom_domain`, so a deploy cannot detach the
  hostname Discord calls. Discord stores an absolute URL and never rediscovers it.
- The dispatcher does **not** defer. A dice roll is sub-millisecond against a 3-second deadline,
  so it replies directly — no follow-up webhook, no interaction token to keep alive.
- Discord validates the endpoint before saving it (a signed PING must Pong, and a corrupted
  signature must be rejected), so a broken Worker cannot be configured — only an already
  configured one can break.

Only `@randsum/roller` and `@randsum/games` are built first; the Worker imports them through
workspace subpath exports.

## Command Registration — MANUAL, and the easiest thing to forget

Registration is **no longer automatic.** The gateway process called `syncCommands()` on every
boot, reconciling the barrel against Discord's registry and writing only on a difference. That
process is gone and nothing in the Worker path replaces it.

**Adding, renaming, or removing a command requires an explicit write:**

```bash
cd apps/discord-bot
bun run deploy-commands   # needs DISCORD_TOKEN + DISCORD_CLIENT_ID
```

This has already caused one outage. #1191 renamed `/su` to `/salvageunion` without a registration
write, leaving Discord advertising a command the code no longer had; every invocation silently
timed out for a week while the bot was healthy. The startup sync was built to make that
impossible, and dropping the gateway gave the failure mode back — so treat the step as part of
shipping a command change, not an afterthought.

Nothing detects the drift for you. The Worker answers an unregistered command's name with
"Unknown command", but only if Discord ever sends it — which it will not, because Discord will
not offer a command it does not know about.

Commands are registered against the *application*, not against a transport, so the existing
global registrations were untouched by the Cloudflare cutover and by dropping Render.

## Slash Command Structure

Each command file exports a named `*Command` object with:

- `data` — a `SlashCommandBuilder` defining the name, description, and options
- `buildEmbed(context)` — the transport-agnostic renderer the Worker calls
- `execute(interaction)` — the discord.js-shaped handler

> `execute` is a **vestige of the gateway path**. Nothing calls it at runtime any more; only the
> command tests exercise it. It is still typed and still passing, but it is dead weight and a
> reasonable thing to remove in its own change.

All game commands import their `roll()` from the corresponding `@randsum/games/<shortcode>`
subpath. The exception is `/salvageunion`, which rolls nothing: Salvage Union moved to the SURef
bot (salvageunion.io), and this command exists only to point users there. Renaming it off `/su`
also frees that name for SURef in servers running both bots.

## Adding a New Command

1. Create `src/commands/<name>.ts` exporting a `Command` object
2. Add the import and entry to `src/commands/index.ts` — the barrel is the only file that needs
   to change, and both the Worker and `deploy-commands.ts` read from it
3. **Run `bun run deploy-commands`.** Deploying is not enough. Global commands take up to an hour
   to propagate; set `DISCORD_GUILD_ID` for instant per-guild registration while developing.

## Testing

Tests use real discord.js builders (not mocks) and verify output via `toJSON()` on embeds. Only
game packages (`@randsum/games/*`) and roller subpaths (`@randsum/roller/*`) are mocked.

`worker/dispatch.ts` is pure — no network, no client, no side effects — which is what makes the
bot's actual behaviour testable without a Worker runtime. It is the half worth protecting; the
transport around it is replaceable.

## Key Constraints

- Private, never published to npm.
- Requires a Discord application with slash command permissions.
- One transport, no fallback: a broken or skipped Worker deploy is a user-visible outage.
- Command registration is manual (see above).
