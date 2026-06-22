# @randsum/discord-bot

Discord bot for rolling dice using RANDSUM game mechanics. Built with discord.js and Bun.

Powered by `@randsum/roller` — **[RDN v0.9.0 Level 4 (Full) Conformant](https://notation.randsum.dev)**

## Features

- **Generic Dice Rolling** (`/roll`) - Roll using standard dice notation (e.g., `2d6+3`)
- **Blades in the Dark** (`/blades`) - Roll dice pools for Blades in the Dark
- **Daggerheart** (`/dh`) - Roll Hope and Fear dice with modifiers and advantage
- **D&D 5e** (`/fifth`) - Roll d20 checks with critical hit/miss display
- **Root RPG** (`/root`) - Roll 2d6 for Root RPG with strong/weak hit mechanics
- **Salvage Union** (`/su`) - Roll on Salvage Union tables
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

### Deploy Commands

Before running the bot, deploy the slash commands to Discord:

```bash
# Deploy to a specific guild (instant, good for development)
bun run deploy-commands

# For global deployment, remove DISCORD_GUILD_ID from .env
```

### Run the Bot

```bash
# Development mode (uses ts files directly)
bun run dev

# Production mode (requires build first)
bun run build
bun run start
```

### Available Commands

- `/roll notation:2d6+3` - Roll generic dice notation
- `/blades dice:3` - Roll Blades in the Dark
- `/dh modifier:2 advantage:Advantage` - Roll Daggerheart with options
- `/fifth` - Roll a D&D 5e d20 check (with critical hit/miss display)
- `/root modifier:1` - Roll Root RPG (-4 to +4 modifier)
- `/su table:Core Mechanic` - Roll on Salvage Union tables
- `/pbta modifier:1` - Roll a Powered by the Apocalypse 2d6 move
- `/notation` - Show dice notation reference guide
- `/help` - List all available commands

## Development

### Project Structure

```
src/
├── commands/        # Slash command handlers
│   ├── index.ts     # Command barrel (single source of truth)
│   ├── blades.ts
│   ├── dh.ts
│   ├── fifth.ts
│   ├── help.ts
│   ├── notation.ts
│   ├── pbta.ts
│   ├── roll.ts
│   ├── root.ts
│   └── su.ts
├── events/          # Discord event handlers
│   ├── interactionCreate.ts
│   └── guildCreate.ts
├── utils/           # Shared utilities (config, constants, discord, logger, metrics, etc.)
├── types.ts         # TypeScript type definitions
├── index.ts         # Bot entry point
└── deploy-commands.ts  # Command registration script
```

### Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.ts`)
2. Export a command object with `data` (SlashCommandBuilder) and `execute` function
3. Add the import and entry to `src/commands/index.ts` — the command barrel is the single source of truth (both `src/index.ts` and `src/deploy-commands.ts` import from it)
4. Run `bun run deploy-commands` to register the new command

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

The bot deploys to **Render** as a `worker` service, defined as Infrastructure-as-Code in the
repo-root [`render.yaml`](../../render.yaml) blueprint (`name: randsum-discord-bot`):

- `numInstances: 1` — a Discord gateway worker must hold a single connection; multiple instances
  would double-process events. Do not scale this up.
- Build is scoped to the bot's dependency subtree (`@randsum/roller` → `@randsum/games` →
  `@randsum/discord-bot`) rather than the full monorepo build.
- Start command: `node apps/discord-bot/dist/index.js`.
- `BUN_VERSION` is pinned (1.3.14) to match CI; `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and
  `DISCORD_GUILD_ID` are set in the Render dashboard (`sync: false` — not committed).

> The `render.yaml` blueprint is not necessarily auto-synced to the live service. If you change it,
> verify the corresponding dashboard values (env vars, Bun version) match.

Slash commands are registered out-of-band with `bun run deploy-commands` (run once per command-set
change, not part of the Render start command). Remove `DISCORD_GUILD_ID` to register commands
globally (~1 hour propagation); set it to a guild ID for instant per-guild registration during
development.

### Running on your own host

```bash
bun run build
export DISCORD_TOKEN=... DISCORD_CLIENT_ID=...
bun run deploy-commands        # once per command-set change
node dist/index.js             # or via pm2 / systemd / docker
```

## Environment Variables

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
