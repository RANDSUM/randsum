# @randsum/discord-bot — RANDSUM Discord Bot

## Overview

Private Discord bot built with `discord.js` v14 that exposes RANDSUM dice mechanics as slash commands. Depends on `@randsum/games` (for game-specific rolls) and `@randsum/roller` (for generic notation rolls). Built with `bunup`, output at `dist/index.js`. Never published to npm.

## Directory Structure

```
apps/discord-bot/
  src/
    index.ts             # Entry point: creates Client, registers commands, listens for events
    deploy-commands.ts   # One-shot script: registers slash commands with Discord API
    types.ts             # Command interface (data: SlashCommandBuilder, execute: fn)
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
    events/
      interactionCreate.ts  # Routes slash commands and autocomplete interactions
      guildCreate.ts     # Sends welcome embed when bot joins a new server
    utils/
      config.ts          # Reads env vars; throws on missing required vars
      constants.ts       # D6 die face image URLs, embed footer
      discord.ts         # CJS require() wrapper for discord.js (Linux CI compat)
      replyWithError.ts  # Shared error embed helper
      ephemeral.ts       # Ephemeral-reply flag helper
      logger.ts          # Structured logging
      metrics.ts         # Lightweight metrics counters
      errorTracker.ts    # Error capture/reporting
      loginWithBackoff.ts # Gateway login with retry/backoff
      gateway.ts         # Shard lifecycle logging, liveness snapshot, stall watchdog
      syncCommands.ts    # Startup reconciliation of Discord's registered commands
```

## Commands

```bash
bun run dev              # Run from source (no build step, for development)
bun run build            # Build to dist/index.js with bunup
bun run start            # Run built output via Node (production)
bun run deploy-commands  # Manual escape hatch — startup now syncs commands automatically
bun run typecheck        # tsc --noEmit
bun run lint             # ESLint
bun run format           # Biome
bun run check            # build + typecheck + format:check + lint + test
```

## Environment Variables

Set these before running:

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `DISCORD_TOKEN`     | Yes      | Bot token from Discord Developer Portal                                     |
| `DISCORD_CLIENT_ID` | Yes      | Application (client) ID                                                     |
| `DISCORD_GUILD_ID`  | No       | If set, deploys commands to that guild only (faster propagation during dev) |
| `SENTRY_DSN`        | No       | When set, captured exceptions are delivered to Sentry (see below)           |

`config.ts` throws at startup if `DISCORD_TOKEN` or `DISCORD_CLIENT_ID` are missing.

## Gateway Observability

A Discord worker has no inbound URL, so "is it up?" is answerable only from what it logs — and
before `src/utils/gateway.ts` existed, it logged nothing about its connection. `index.ts`
registered `ClientReady`, `InteractionCreate`, `GuildCreate` and `client.on('error')`, none of
which fire on a shard disconnect. A dropped WebSocket therefore left the process alive, the
5-minute `metrics.flush` heartbeat ticking, and Render reporting a healthy worker, while the bot
was offline in Discord.

Three pieces close that:

- **Every transition is logged.** `registerGatewayLogging(client)` wires `ShardReady`,
  `ShardResume`, `ShardReconnecting`, `ShardDisconnect` and `ShardError` to `gateway.*` lines
  carrying shard id, close code, and how long the previous status held.
- **The heartbeat carries liveness.** `metrics.flush` embeds `gatewaySnapshot()`
  (`status`, `connected`, `forMs`, `disconnects`, `resumes`). This is the load-bearing part: a
  heartbeat that proves only "the event loop is turning" is *worse* than none, because it reads
  as health. Grep `'"connected":false'` to find an outage.
- **A stall is reported once.** `startGatewayWatchdog()` runs before login and captures an
  exception if the connection sits off `ready` past five minutes. Starting it *before* login is
  deliberate — the failure it exists to catch is a login that never returns, which
  `loginWithBackoff` cannot see because that only logs when a call *rejects*.

It deliberately **does not auto-restart** a stalled connection. Discord throttles session starts,
so restarting into a throttle deepens the outage; the watchdog escalates and a human decides.

> On 2026-08-18 `client.login()` hung for a full hour between `bot.connecting` and
> `bot.login_succeeded` with zero log output. `bot.login_succeeded` now records `elapsedMs`.

## Error Tracking

`captureException` (`src/utils/errorTracker.ts`) always emits a structured log line. When
`SENTRY_DSN` is set it *also* POSTs the event to Sentry's envelope ingest API using plain
`fetch` — there is no `@sentry/node` dependency, so enabling reporting costs the worker bundle
nothing.

Three properties are load-bearing, and each has a test:

- **Tracking never throws.** A delivery failure is `logger.warn`-ed, never routed back through
  `captureException` (which would recurse). A malformed DSN degrades to logging-only and says so
  at boot (`errorTracker.init reason=invalid_dsn`) — a typo'd DSN otherwise looks identical to a
  working one from the dashboard: the service comes up and simply never reports.
- **Captures survive a deliberate exit.** Delivery is async, so the fatal-login path — the one
  event that explains a crash loop — would be discarded by an immediate `process.exit(1)`.
  `index.ts` awaits `flushErrorTracker()` before exiting.
- **Delivery is injectable.** `initErrorTracker({ send })` takes a `SendEnvelope`, mirroring the
  `RestLike` seam in `syncCommands`, so tests never touch the network or patch global `fetch`.

Before this was wired, `forwardToSentry` was an empty stub: `SENTRY_DSN` was accepted, logged as
`enabled: true`, and no event was ever sent. Treat "nothing in Sentry" as meaning the bot never
reached its error paths only if `errorTracker.init` logged `enabled: true` for the run in question.

## Deployment

**The bot runs as a Cloudflare Worker on HTTP interactions. The gateway is no longer how
interactions arrive.** Discord POSTs them to `https://bot.randsum.dev/`, configured as the
application's Interactions Endpoint URL, and `.github/workflows/deploy-cloudflare.yml` deploys
`apps/discord-bot/wrangler.jsonc` on merge to `main`.

The two transports are mutually exclusive — setting that URL is what stopped gateway delivery, and
clearing it is what would start it again. Discord validates the endpoint before saving it (a signed
PING must Pong, and a corrupted signature must be rejected), so a broken Worker cannot be
configured, only an already-configured one can break.

- `DISCORD_PUBLIC_KEY` is a committed `var`, not a secret — see the reasoning in `wrangler.jsonc`.
- `bot.randsum.dev` is declared in `routes`, so a deploy cannot detach the hostname Discord calls.
- The Worker needs **no** `DISCORD_TOKEN`. HTTP interactions are authenticated by request
  signature, not by a bot session, so the most sensitive credential simply is not present.
- The dispatcher does **not** defer. A dice roll is sub-millisecond against a 3-second deadline, so
  it replies directly — no follow-up webhook, no interaction token to keep alive.

### The gateway path is still here, and still builds

`src/index.ts` and everything under `src/events/` remain the discord.js gateway bot. It is dormant,
not dead: it is the rollback, and a rollback that does not compile is not a rollback. Keep both
transports working until the Render service is actually deleted.

Historically it deployed to **Render** as a `worker` service via the repo-root `render.yaml`
blueprint (`name: randsum-discord-bot`, `runtime: node`, `region: oregon`, `plan: starter`). If it
is ever brought back:

- `numInstances` MUST stay `1` — a gateway worker holds a single connection; multiple instances
  double-process events.
- Build is scoped to the dependency subtree, not the full monorepo:
  `bun install --frozen-lockfile && bun run --filter @randsum/roller --filter @randsum/games --filter @randsum/discord-bot build`
- Start: `node apps/discord-bot/dist/index.js`
- `BUN_VERSION` pinned to 1.3.14 (matches `.bun-version` / CI). `DISCORD_TOKEN`,
  `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` are `sync: false` (set in the dashboard, not committed).
- The blueprint may not be auto-synced to the live service — if you edit it, also reconcile the
  Render dashboard env vars.

### Slash command registration did NOT move

Commands are registered against the application, not against a transport, so the existing global
registrations kept working across the cutover untouched. The gateway bot reconciles them on
startup; with it stopped, `bun run deploy-commands` is the way to push a changed command list.
**Adding or renaming a command now requires that step explicitly** — nothing in the Worker path
does it for you, and the Worker will answer an unregistered command's name with "Unknown command"
only if Discord ever sends it, which it will not.

### Manual / local deployment workflow

1. Set env vars
2. `bun run build` — produces `dist/index.js`
3. `bun start` — runs the bot, which reconciles slash commands on startup (see
   [Command Registration](#command-registration)). `bun run deploy-commands` still exists as a
   manual escape hatch but is not required.

## Slash Command Structure

Each command file exports a named `*Command` object with:

- `data` — a `SlashCommandBuilder` instance defining the name, description, and options
- `execute(interaction)` — async handler; uses `interaction.deferReply()` + `editReply()` pattern

All game commands import their `roll()` from the corresponding `@randsum/games/<shortcode>` subpath. The exception is `/salvageunion`, which rolls nothing: Salvage Union moved to the SURef bot (salvageunion.io), and this command exists only to point users there. Renaming it off `/su` also frees that name for SURef in servers running both bots.

## Command Registration

Registration is **automatic and self-healing** — do not rely on remembering a manual step.

On every boot, after login succeeds, `src/index.ts` calls `syncCommands()`. It fetches the
commands Discord currently has registered, normalizes both sides, and issues a write **only if
they differ**:

- identical → one GET, logs `commands.sync.unchanged`, no write
- different → PUT of the full barrel, logs `commands.sync.updated` with `added` / `removed`
- API failure → logs `commands.sync.failed` and the bot **keeps running** on its existing
  command list; a registry problem must never take down a connected bot

Ordering is deliberate: the sync runs *after* login, so the handlers are live before the registry
can advertise them. Discord can never list a command this process cannot serve.

Normalization is the load-bearing part. Discord echoes back fields the bot never declares
(`id`, `application_id`, `version`, `integration_types`, …) and fills defaults for omitted ones
(`required: false`, `type: 1`), so both sides are reduced to just the declared fields before
comparison. Without that, every restart would look like a change and burn the application's daily
command-write budget. Command order is normalized away; **option order is preserved**, because
Discord treats it as semantic (required options must come first).

`bun run deploy-commands` remains as a manual escape hatch — useful to force a write without
restarting the worker — but it is no longer part of the deploy path.

## Adding a New Command

1. Create `src/commands/<name>.ts` exporting a `Command` object
2. Add the import and entry to `src/commands/index.ts` — this is the only file that needs to change for registration (both `index.ts` and `deploy-commands.ts` import from the barrel)
3. Deploy. The next boot registers it automatically. Global commands can take up to an hour to
   propagate to all clients; set `DISCORD_GUILD_ID` locally for instant propagation while developing.

## Testing

Tests use real discord.js builders (not mocks) and verify output via `toJSON()` on embeds extracted from `interaction.editReply` mock calls. discord.js is loaded through `src/utils/discord.ts` which uses `require()` to avoid Bun's CJS→ESM interop issues on Linux CI. Only game packages (`@randsum/games/*`) and roller subpaths (`@randsum/roller/*`) are mocked.

## Key Constraints

- Private, never published to npm.
- Requires a running Discord bot application with slash command permissions.
- `bun run dev` runs from source directly; `bun start` requires a prior `bun run build`.
