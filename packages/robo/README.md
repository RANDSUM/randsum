# @randsum/robo

A Discord bot with dice rolling capabilities using Robo.js and Colyseus.

## Overview

This package provides a Discord bot built with Robo.js that integrates with the RANDSUM dice rolling system. It supports Discord Activities with real-time state management via Colyseus.

## Features

- Discord bot functionality via Robo.js
- Dice rolling integration with @randsum/roller
- Discord Activities support
- Real-time multiplayer state management with Colyseus

## Installation

This package is part of the RANDSUM monorepo and uses Bun workspace dependencies.

## Development

```bash
# Install dependencies (from monorepo root)
bun install

# Run in development mode
bun run --filter @randsum/robo dev

# Build
bun run --filter @randsum/robo build

# Start production server
bun run --filter @randsum/robo start
```

## Configuration

Configuration files are located in the `config/` directory. See Robo.js documentation for configuration options.

## License

MIT
