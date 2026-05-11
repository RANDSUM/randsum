# @randsum/discord-bot

Discord bot for rolling dice using RANDSUM game mechanics. Built with discord.js and Bun.

Powered by `@randsum/roller` — **[RDN v0.9.0 Level 4 (Full) Conformant](https://notation.randsum.dev)**

## Features

- **Generic Dice Rolling** (`/roll`) - Roll using standard dice notation (e.g., `2d6+3`)
- **Blades in the Dark** (`/blades`) - Roll dice pools for Blades in the Dark
- **Daggerheart** (`/dh`) - Roll Hope and Fear dice with modifiers and advantage
- **Root RPG** (`/root`) - Roll 2d6 for Root RPG with strong/weak hit mechanics
- **Salvage Union** (`/su`) - Roll on Salvage Union tables
- **Notation Guide** (`/notation`) - Display a reference guide for dice notation

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
- `/blades dice:3` - Roll Blades in the Dark (0-4 dice)
- `/dh modifier:2 advantage:Advantage` - Roll Daggerheart with options
- `/root modifier:1` - Roll Root RPG (-4 to +4 modifier)
- `/su table:Core Mechanic` - Roll on Salvage Union tables
- `/notation` - Show dice notation reference guide

## Development

### Project Structure

```
src/
├── commands/        # Slash command handlers
│   ├── blades.ts
│   ├── dh.ts
│   ├── notation.ts
│   ├── roll.ts
│   ├── root.ts
│   └── su.ts
├── events/          # Discord event handlers
│   ├── ready.ts
│   └── interactionCreate.ts
├── utils/           # Shared utilities
│   ├── config.ts
│   └── constants.ts
├── types.ts         # TypeScript type definitions
├── index.ts         # Bot entry point
└── deploy-commands.ts  # Command registration script
```

### Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.ts`)
2. Export a command object with `data` (SlashCommandBuilder) and `execute` function
3. Import and register it in `src/index.ts`
4. Import and add it to `src/deploy-commands.ts`
5. Run `bun run deploy-commands` to register the new command

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

The bot is currently self-hosted — there is no automated deploy config checked in. To run it on your own host:

```bash
# Build
bun run build

# Set env vars (DISCORD_TOKEN, DISCORD_CLIENT_ID)
export DISCORD_TOKEN=...
export DISCORD_CLIENT_ID=...

# Deploy slash commands (once per command-set change)
bun run deploy-commands

# Run with your process manager of choice (pm2, systemd, docker, etc.)
pm2 start dist/index.js --name randsum-bot
```

Remove `DISCORD_GUILD_ID` from the runtime environment to register commands globally (~1 hour propagation). Leave it set to a guild ID for instant per-guild registration during development.

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
