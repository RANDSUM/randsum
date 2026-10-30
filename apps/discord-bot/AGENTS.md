# @randsum/discord-bot — RANDSUM Discord Bot

Private Discord bot that exposes RANDSUM dice mechanics as slash commands. Depends on `@randsum/games` (game rolls) and `@randsum/roller` (generic notation rolls). Never published to npm.

It is a **Cloudflare Worker serving HTTP interactions**. Discord POSTs each interaction to `https://bot.randsum.dev/` and reads the response body. There is no gateway connection, no session and no single-instance constraint, and there is no second transport or fallback: a broken Worker deploy is a user-visible outage. discord.js is not a dependency; ignore any older material that describes a gateway bot.

There is **no `build` script**: wrangler compiles `src/worker/index.ts` itself. The app is listed in `BUILD_EXEMPT` in `scripts/check-workspace-scripts.ts` for that reason.

## Layout

- `src/worker/index.ts`: Worker entry. Verifies the signature, dispatches, responds.
- `src/worker/verify.ts`: Ed25519 signature verification (WebCrypto).
- `src/worker/dispatch.ts`: pure interaction payload → response payload, no I/O. Typed with `discord-api-types` (`APIInteraction` in, `APIInteractionResponse` out), so a malformed response is a type error. This is the half worth protecting.
- `src/commands/index.ts`: the command barrel, the single source of truth that both the Worker and `deploy-commands.ts` read.
- `src/commands/lib/`: shared scaffolding (context, view renderer, reroll codec, spec input bounds).
- `src/utils/builders.ts`: portable Discord primitives (`@discordjs/builders`, `discord-api-types`) that run on workerd. Commands import from here.
- `src/utils/palette.ts`: every accent colour and outcome glyph.
- `src/deploy-commands.ts`: one-shot script that writes the slash command registry with a single `fetch` PUT.

## Commands

```bash
bun run dev              # wrangler dev: run the Worker locally
bun run deploy           # wrangler deploy (CI runs this once CI is green on main)
bun run deploy-commands  # write the slash command registry (the deploy job runs it)
bun run typecheck        # tsc --noEmit
bun run check            # typecheck + test
```

## Configuration

The Worker's only input is `DISCORD_PUBLIC_KEY`, a committed `var` in `wrangler.jsonc`. It is not a secret: it verifies Discord's signatures and cannot produce one.

`DISCORD_TOKEN` and `DISCORD_CLIENT_ID` (required) and `DISCORD_GUILD_ID` (optional; registers to one guild for instant propagation) are read by `src/utils/config.ts`, which only `deploy-commands.ts` imports. The Worker needs none of them.

## Errors and logging

The codebase has no error tracker or logger, deliberately. Cloudflare Workers Observability (enabled in `wrangler.jsonc`) captures uncaught exceptions and request telemetry at the platform level. Structured logging, if ever needed, must be written against the Worker's `env` argument and called from `dispatch.ts`; workerd has no `process.env`.

## Deployment

`.github/workflows/deploy-cloudflare.yml` deploys `apps/discord-bot/wrangler.jsonc` once CI is green on `main`, then runs `deploy-commands` (an idempotent bulk overwrite) whenever `src/commands/**` or `deploy-commands.ts` changed. Triage, rollback and DR live in `docs/operations.md`.

- `bot.randsum.dev` is a `custom_domain` route, so a deploy cannot detach the hostname Discord calls.
- The dispatcher does **not** defer: a roll is sub-millisecond against a 3-second deadline, so it replies directly.

## Slash command structure

Each command file exports a named `*Command` object literal typed `Command`:

- `data`: a `SlashCommandBuilder` with the name, description and options.
- `buildView(context)`: takes a `CommandContext` (option accessors plus the caller's display name) and returns a `RollView`, one **Components V2** container per dice pool. Pure: no interaction, no network, no replying. It throws on error, and `dispatchInteraction` renders the error container.

The bot renders Components V2 only. `IsComponentsV2` forbids `embeds`, so the two shapes cannot be mixed on one message.

**Building a view.** Route through `rollContainer()` in `commands/lib/view.ts`; it owns the headline / consequence / facts / body / derivation layout and the `-#` subtext footer. `renderTrace()` turns a `RollRecord` into step lines via `@randsum/roller/trace`. Components V2 has no inline field grid, so label/value pairs go through `renderFacts` as one line.

**Reroll buttons.** `commands/lib/reroll.ts` encodes the command name and options into the button's `custom_id` (the only state a stateless Worker has) and decodes it back into a `CommandContext`. Pass `encodeReroll('<command>', { ...options })` to `rollContainer`. A `custom_id` caps at 100 characters; when the encoding is longer, `encodeReroll` returns `undefined` and the button is omitted. Never truncate it: a truncated id decodes into a different roll.

A reroll answers with a **new message (type 4), never an edit (type 7)**. The Worker cannot tell whether the clicker is the original roller without spending ~19 of those 100 characters on a user id, and an edit would let a bystander overwrite someone else's result. Type 7 is only for stateless view switching, like `/notation`'s selector.

Game commands import `roll()` from the matching `@randsum/games/<shortcode>` subpath. `/salvageunion` rolls nothing: it points users at the SURef bot (salvageunion.io).

## Adding a command

1. Create `src/commands/<name>.ts` exporting a `Command` object.
2. Add it to `src/commands/index.ts`. The barrel is the only file that needs to change.
3. List it on the public pages: `apps/site/src/pages/discord.astro`, `apps/site/src/content/docs/tools/discord-bot.mdx`, `LISTING.md` and `README.md`. `__tests__/public-copy.test.ts` fails until every page names it.
4. Merging registers it globally. While developing, run `bun run deploy-commands` with `DISCORD_GUILD_ID` set.

## Testing

Tests use real `@discordjs/builders` builders. Only game packages (`@randsum/games/*`) and roller subpaths (`@randsum/roller/*`) are mocked.

Assert against a view through the helpers in `__tests__/lib/view.ts` (`textOf`, `linesOf`, `accentsOf`, `buttonIdsOf`) rather than walking the component tree, which breaks when a separator moves.

Two traps: `bun test` does not typecheck, so run `bun run check`. And `mock.module` leaks across test files **even under `--isolate`**, so a test that relies on an un-mocked import can pass alone and fail in the suite; supply explicit fixtures instead.
