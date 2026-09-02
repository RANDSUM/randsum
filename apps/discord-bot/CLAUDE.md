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
    types.ts             # Command interface (data, buildView)
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
      palette.ts         # Accent colours and outcome glyphs — the visual vocabulary
      discord.ts         # discord.js REST barrel — deploy-commands only, never the Worker
      config.ts          # Reads env vars; throws on missing required vars (deploy-commands only)
      constants.ts       # Footer attribution
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

## Error surface

**There is none in this codebase, deliberately.** `errorTracker.ts` and `logger.ts` were removed
along with `Command.execute`: `/notation`'s gateway handler was the last thing that called
`captureException`, and a seam with no call sites is not a seam. The module could not have been
reused as-is anyway — it read `process.env`, which workerd does not have.

**Cloudflare Workers Observability** (enabled in `wrangler.jsonc`) is the error surface, and it
needs nothing from the application: it captures uncaught exceptions and request telemetry at the
platform level. Note that the Worker path never emitted an application log line even before this
— `dispatch.ts` and `worker/index.ts` have always been silent — so nothing observable changed.

Re-adding structured logging or remote delivery means writing it against the Worker's `env`
argument and calling it from `dispatch.ts`, which is a genuinely different shape from what was
there.

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
- `buildView(context)` — the renderer the Worker calls. Takes a `CommandContext` (option
  accessors plus the caller's display name) and returns a `RollView`: `readonly
  ContainerBuilder[]`, one **Components V2** container per dice pool. Pure: no interaction, no
  network, no replying.

> `buildEmbed` and `buildComponents` are **gone**, as `execute(interaction)` and `autocomplete`
> went before them. The bot renders Components V2 exclusively: setting `IsComponentsV2` forbids
> `embeds` outright, so the two shapes cannot be mixed on one message. Errors are the
> dispatcher's job: `buildView` throws, and `dispatchInteraction` renders the error container.
>
> `buildView` is optional on the interface so the dispatcher can answer "not available on this
> deployment" rather than guess, but every command in the barrel has one and
> `__tests__/worker/dispatch.test.ts` holds that line.

**Building a view.** Route through `rollContainer()` in `commands/lib/view.ts` rather than
assembling a container by hand — it owns the headline / consequence / facts / body / derivation
layout, and the `-#` subtext footer that replaces the embed footer Components V2 does not have.
`renderTrace()` turns a `RollRecord` into the step lines (`@randsum/roller/trace`), and
`utils/palette.ts` holds every accent colour and outcome glyph. Two constraints worth knowing:
Components V2 has no `inline` field grid, so label/value pairs go through `renderFacts` as one
line; and a `custom_id` caps at 100 characters, so a reroll button carrying long notation is
dropped rather than truncated (Discord rejects the whole message otherwise).

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

Tests use real discord.js builders (not mocks). Only game packages (`@randsum/games/*`) and
roller subpaths (`@randsum/roller/*`) are mocked.

Assert against a view through the helpers in `__tests__/lib/view.ts` — `textOf`, `linesOf`,
`accentsOf`, `buttonIdsOf` — rather than walking the component tree. A container has no title,
so the literal equivalent of `expect(embed.data.title)` is
`view[0]!.toJSON().components[0]!.content`, which breaks when a separator moves rather than when
the text changes.

**Two traps.** `bun test` does not typecheck, so a test can pass while violating
`exactOptionalPropertyTypes` — run `bun run check`. And `mock.module` leaks across test files
**even under `--isolate`**, so a test relying on an un-mocked import can pass alone and fail in
the suite; supply explicit fixtures instead.

`worker/dispatch.ts` is pure — no network, no client, no side effects — which is what makes the
bot's actual behaviour testable without a Worker runtime. It is the half worth protecting; the
transport around it is replaceable.

## Key Constraints

- Private, never published to npm.
- Requires a Discord application with slash command permissions.
- One transport, no fallback: a broken or skipped Worker deploy is a user-visible outage.
- Command registration is manual (see above).
