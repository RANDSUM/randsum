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
      blades.ts          # /blades — Blades in the Dark (rating 0-10)
      dh.ts              # /dh — Daggerheart
      fifth.ts           # /fifth — D&D 5e
      pbta.ts            # /pbta — Powered by the Apocalypse
      root.ts            # /root — Root RPG
      su.ts              # /su — Salvage Union
      roll.ts            # /roll — generic notation roller
      notation.ts        # /notation — parse and describe a notation string
    events/
      interactionCreate.ts  # Routes incoming interactions to the matching command
    utils/
      config.ts          # Reads env vars; throws on missing required vars
      constants.ts       # D6 die face image URLs, embed footer
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

## Key Constraints

- Private, never published to npm.
- Requires a running Discord bot application with slash command permissions.
- `bun run dev` runs from source directly; `bun start` requires a prior `bun run build`.
