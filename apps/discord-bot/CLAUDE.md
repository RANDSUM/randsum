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
      fifth.ts           # /fifth — D&D 5e (with critical hit/miss display)
      help.ts            # /help — lists all available commands
      notation.ts        # /notation — live docs from @randsum/roller/docs, paginated by category
      pbta.ts            # /pbta — Powered by the Apocalypse
      roll.ts            # /roll — generic notation roller
      root.ts            # /root — Root RPG
      su.ts              # /su — Salvage Union
    events/
      interactionCreate.ts  # Routes slash commands and autocomplete interactions
      guildCreate.ts     # Sends welcome embed when bot joins a new server
    utils/
      config.ts          # Reads env vars; throws on missing required vars
      constants.ts       # D6 die face image URLs, embed footer
      discord.ts         # CJS require() wrapper for discord.js (Linux CI compat)
      replyWithError.ts  # Shared error embed helper
```

## Commands

```bash
bun run dev              # Run from source (no build step, for development)
bun run build            # Build to dist/index.js with bunup
bun run start            # Run built output via Node (production)
bun run deploy-commands  # Register slash commands with Discord API (run once after changes)
bun run typecheck        # tsc --noEmit
bun run lint             # ESLint
bun run format           # Prettier
bun run check            # build + typecheck + format:check + lint + test
```

## Environment Variables

Set these before running:

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `DISCORD_TOKEN`     | Yes      | Bot token from Discord Developer Portal                                     |
| `DISCORD_CLIENT_ID` | Yes      | Application (client) ID                                                     |
| `DISCORD_GUILD_ID`  | No       | If set, deploys commands to that guild only (faster propagation during dev) |

`config.ts` throws at startup if `DISCORD_TOKEN` or `DISCORD_CLIENT_ID` are missing.

## Deployment Workflow

1. Set env vars
2. `bun run build` — produces `dist/index.js`
3. `bun run deploy-commands` — registers slash commands (only needed once, or after adding/changing commands)
4. `bun start` — runs the bot

## Slash Command Structure

Each command file exports a named `*Command` object with:

- `data` — a `SlashCommandBuilder` instance defining the name, description, and options
- `execute(interaction)` — async handler; uses `interaction.deferReply()` + `editReply()` pattern

All game commands import their `roll()` from the corresponding `@randsum/games/<shortcode>` subpath.

## Adding a New Command

1. Create `src/commands/<name>.ts` exporting a `Command` object
2. Add the import and entry to `src/commands/index.ts` — this is the only file that needs to change for registration (both `index.ts` and `deploy-commands.ts` import from the barrel)
3. Run `bun run deploy-commands` to register with Discord

## Testing

Tests use real discord.js builders (not mocks) and verify output via `toJSON()` on embeds extracted from `interaction.editReply` mock calls. discord.js is loaded through `src/utils/discord.ts` which uses `require()` to avoid Bun's CJS→ESM interop issues on Linux CI. Only game packages (`@randsum/games/*`) and roller subpaths (`@randsum/roller/*`) are mocked.

## Key Constraints

- Private, never published to npm.
- Requires a running Discord bot application with slash command permissions.
- `bun run dev` runs from source directly; `bun start` requires a prior `bun run build`.
