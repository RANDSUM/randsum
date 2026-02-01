# @randsum/discord-bot

Discord bot for rolling dice using RANDSUM game mechanics. Built with discord.js and Bun.

## Features

- **Generic Dice Rolling** (`/roll`) - Roll using standard dice notation (e.g., `2d6+3`)
- **Blades in the Dark** (`/blades`) - Roll dice pools for Blades in the Dark
- **Daggerheart** (`/dh`) - Roll Hope and Fear dice with modifiers and advantage
- **Root RPG** (`/root`) - Roll 2d6 for Root RPG with strong/weak hit mechanics
- **Salvage Union** (`/su`) - Roll on Salvage Union tables
- **Notation Guide** (`/notation`) - Display a reference guide for dice notation

## Setup

### Prerequisites

- [Bun](https://bun.sh) 1.3.8 or higher
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
- `/blades dice:3` - Roll Blades in the Dark (0-10 dice)
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

### Deploying to Railway

[Railway](https://railway.app) provides an easy way to deploy the Discord bot with automatic builds and environment variable management. This project includes a pre-configured `railway.json` file optimized for the monorepo structure.

#### Prerequisites

- A [Railway account](https://railway.app)
- Your Discord bot credentials (see [Getting Discord Credentials](#getting-discord-credentials))
- The monorepo repository pushed to GitHub (recommended for automatic deployments)

#### Monorepo Configuration

The included `railway.json` is configured to:

- Build from the monorepo root to access shared dependencies
- Set the correct working directory for the Discord bot
- Handle Bun-specific build and start commands

#### Step-by-Step Railway Deployment

1. **Install Railway CLI** (optional, but recommended):

   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:

   ```bash
   railway login
   ```

3. **Initialize Railway project** (from the `apps/discord-bot` directory):

   ```bash
   cd apps/discord-bot
   railway init
   ```

4. **Set environment variables**:

   ```bash
   railway variables set DISCORD_TOKEN=your_bot_token_here
   railway variables set DISCORD_CLIENT_ID=your_client_id_here
   ```

   Or set them through the Railway dashboard:
   - Go to your project on [Railway Dashboard](https://railway.app/dashboard)
   - Click on your service → Variables tab
   - Add `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`

5. **Deploy commands before first deployment**:

   You must deploy slash commands locally before Railway deployment:

   ```bash
   # From apps/discord-bot directory
   bun run deploy-commands
   ```

6. **Deploy to Railway**:

   ```bash
   railway up
   ```

   Or connect your GitHub repository for automatic deployments:
   - Go to Railway Dashboard → Your Project
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Railway will automatically detect the `railway.json` configuration

#### Deploying via Railway Dashboard (No CLI)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your RANDSUM monorepo repository
4. Configure the service settings:
   - **Root Directory**: `apps/discord-bot`
   - **Build Command**: Leave empty (Railway will use `railway.json`)
   - **Start Command**: Leave empty (Railway will use `railway.json`)
   - The pre-configured `railway.json` file will handle the monorepo build process automatically
5. Add environment variables in the Variables tab:
   - `DISCORD_TOKEN`: Your bot token from Discord Developer Portal
   - `DISCORD_CLIENT_ID`: Your application ID from Discord Developer Portal
6. Deploy slash commands locally before Railway deployment:

   ```bash
   cd apps/discord-bot
   bun run deploy-commands
   ```

7. Click "Deploy" and monitor the deployment logs

#### Important Notes

- Remove `DISCORD_GUILD_ID` from production environment variables to deploy commands globally
- Global command deployment can take up to 1 hour to propagate
- Railway automatically restarts your bot on crashes
- Monitor logs in the Railway dashboard under the "Deployments" tab

### Other Deployment Options

For self-hosted or alternative deployment methods:

```bash
# Build the bot
bun run build

# Run with PM2 (process manager)
pm2 start dist/index.js --name randsum-bot

# Or use systemd, Docker, etc.
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
