# @randsum/discord-bot

Discord bot for rolling dice using RANDSUM game mechanics. Runs as a Cloudflare Worker on
Discord's HTTP interactions, at `bot.randsum.dev`.

Powered by `@randsum/roller` — **[RDN v0.9.0 Level 4 (Full) Conformant](https://notation.randsum.dev)**

## Features

- **Generic Dice Rolling** (`/roll`) - Roll using standard dice notation (e.g., `2d6+3`)
- **Blades in the Dark** (`/blades`) - Roll dice pools for Blades in the Dark
- **Daggerheart** (`/dh`) - Roll Hope and Fear dice with modifiers and advantage
- **D&D 5e** (`/fifth`) - Roll d20 checks with critical hit/miss display
- **Root RPG** (`/root`) - Roll 2d6 for Root RPG with strong/weak hit mechanics
- **Salvage Union** (`/salvageunion`) - Points to the [SURef bot](https://salvageunion.io/discord), which handles Salvage Union rolls and lookups
- **Powered by the Apocalypse** (`/pbta`) - Roll 2d6 PbtA moves
- **Notation Guide** (`/notation`) - Display a reference guide for dice notation
- **Help** (`/help`) - List all available commands

## Setup

### Prerequisites

- [Bun](https://bun.sh) 1.3.10 or higher
- A Discord account and server for testing
- A Discord application/bot (create at [Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. Install dependencies from the monorepo root:

```bash
bun install
```

2. Create a `.env` file in the `apps/discord-bot` directory:

```bash
cd apps/discord-bot
cp .env.example .env
```

3. Fill in your Discord credentials in `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_test_guild_id_here  # Optional, for faster dev deployment
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application (or select an existing one)
3. Go to the "Bot" section:
   - Reset and copy your bot token → `DISCORD_TOKEN`
   - Enable "Message Content Intent" if needed
4. Go to "General Information":
   - Copy "Application ID" → `DISCORD_CLIENT_ID`
5. To get your Guild ID (server ID):
   - Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
   - Right-click your server icon → Copy Server ID → `DISCORD_GUILD_ID`

### Inviting the Bot

Generate an invite link with these permissions:

1. Go to OAuth2 → URL Generator in the Developer Portal
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copy the generated URL and open it to invite the bot to your server

## Usage

### Slash Commands

Slash commands must be registered explicitly. **Deploying does not do it** — the Worker reads
the registry, it never writes it.

```bash
bun run deploy-commands
```

Run this whenever you add, rename, or remove a command. Set `DISCORD_GUILD_ID` in `.env` for
instant per-guild registration while developing; leave it unset for global registration
(~1 hour propagation).

### Run the Bot

```bash
# Local Worker, via wrangler
bun run dev
```

There is no `build` or `start` — wrangler compiles `src/worker/index.ts` directly, and there is
no long-lived process to start.

### Available Commands

- `/roll notation:2d6+3` - Roll generic dice notation
- `/blades dice:3` - Roll Blades in the Dark
- `/dh modifier:2 advantage:Advantage` - Roll Daggerheart with options
- `/fifth` - Roll a D&D 5e d20 check (with critical hit/miss display)
- `/root modifier:1` - Roll Root RPG (-4 to +4 modifier)
- `/salvageunion` - Point to the SURef bot for Salvage Union
- `/pbta modifier:1` - Roll a Powered by the Apocalypse 2d6 move
- `/notation` - Show dice notation reference guide
- `/help` - List all available commands

## Development

### Project Structure

```
src/
├── worker/          # Cloudflare Worker — the bot
│   ├── index.ts     # Entry: verify signature, dispatch, respond
│   ├── verify.ts    # Ed25519 signature verification (WebCrypto)
│   └── dispatch.ts  # Pure: interaction payload -> response payload
├── commands/        # Slash command handlers
│   ├── index.ts     # Command barrel (single source of truth)
│   ├── blades.ts
│   ├── dh.ts
│   ├── fate.ts
│   ├── fifth.ts
│   ├── help.ts
│   ├── notation.ts
│   ├── pbta.ts
│   ├── roll.ts
│   ├── root.ts
│   ├── salvageunion.ts
│   └── lib/         # Shared command scaffolding
├── utils/           # builders (portable), discord (REST), config, constants, logger, etc.
├── types.ts         # TypeScript type definitions
└── deploy-commands.ts  # Command registration script
```

### Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.ts`)
2. Export a command object with `data` (SlashCommandBuilder) and `execute` function
3. Add the import and entry to `src/commands/index.ts` — the command barrel is the single source of truth (both `src/worker/index.ts` and `src/deploy-commands.ts` import from it)
4. Deploy, then run `bun run deploy-commands` — registration is a separate, explicit step (see [Slash Commands](#slash-commands))

### Testing

```bash
bun run test
```

### Linting and Formatting

```bash
bun run lint
bun run format
bun run typecheck
```

## Deployment

The bot deploys to **Cloudflare Workers** from [`wrangler.jsonc`](./wrangler.jsonc), via
`.github/workflows/deploy-cloudflare.yml` on merge to `main`. Discord POSTs interactions to
`https://bot.randsum.dev/`.

```bash
bun run --filter '@randsum/roller' --filter '@randsum/games' build
bunx wrangler@4 deploy -c apps/discord-bot/wrangler.jsonc
```

- `bot.randsum.dev` is a `custom_domain` route, so a deploy cannot detach the hostname Discord
  calls — and Discord never rediscovers that URL.
- `DISCORD_PUBLIC_KEY` is a committed `var`, not a secret: it verifies Discord's signatures and
  cannot produce one.
- The Worker needs **no `DISCORD_TOKEN`**.

> **There is no fallback transport.** The discord.js gateway bot and its Render host were both
> removed on 2026-09-01. A skipped or broken deploy is a user-visible outage.

> **Registering commands is a separate step.** Deploying the Worker does not update Discord's
> command list — run `bun run deploy-commands`.

Full triage, rollback, and DR procedures: [`apps/DEPLOY.md`](../DEPLOY.md).

## Environment Variables

Used by `bun run deploy-commands` only — the Worker reads none of them.

| Variable            | Required | Description                                           |
| ------------------- | -------- | ----------------------------------------------------- |
| `DISCORD_TOKEN`     | Yes      | Bot token from Discord Developer Portal               |
| `DISCORD_CLIENT_ID` | Yes      | Application ID from Discord Developer Portal          |
| `DISCORD_GUILD_ID`  | No       | Guild ID for development (instant command deployment) |

## Migrating from Robo.js

This bot replaces the Robo.js-based version with vanilla discord.js:

- **File-based routing** → Explicit command registration
- **Robo CLI** → Standard Bun scripts
- **Robo.js framework** → Vanilla discord.js
- **Built-in features** → Manual implementation (more control)

All command functionality has been preserved from the original Robo.js version.

## License

MIT - See [LICENSE](../../LICENSE) for details

## Links

- [RANDSUM Monorepo](https://github.com/RANDSUM/randsum)
- [Discord.js Documentation](https://discord.js.org)
- [Discord Developer Portal](https://discord.com/developers/applications)
