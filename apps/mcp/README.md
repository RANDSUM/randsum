<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/mcp</h1>
  <h3>Model Context Protocol server for RANDSUM dice rolling and game mechanics</h3>
</div>

[![npm version](https://img.shields.io/npm/v/@randsum/mcp.svg)](https://www.npmjs.com/package/@randsum/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/RANDSUM/randsum/commits/main)

## 🎲 Features

- **MCP Tools**: Expose RANDSUM dice rolling functionality to LLMs
- **Dice Notation Validation**: Validate and explain dice notation syntax
- **Documentation Resources**: Access to complete dice notation reference
- **Type Safety**: Full TypeScript support with intelligent type inference

## 🚀 Installation

### Via npm (Recommended)

```bash
npm install -g @randsum/mcp
```

### Via npx (No Installation Required)

```bash
npx @randsum/mcp --help
```

### Local Development

```bash
npm install @randsum/mcp
# or
yarn add @randsum/mcp
# or
bun add @randsum/mcp
```

## ⚙️ Configuration

### Claude Desktop

Add the following to your Claude Desktop MCP configuration file:

**Location:**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "randsum": {
      "command": "npx",
      "args": ["@randsum/mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### HTTP Mode (Advanced)

For remote access or debugging, you can run the server in HTTP mode:

```json
{
  "mcpServers": {
    "randsum-http": {
      "command": "npx",
      "args": ["@randsum/mcp", "--transport", "http", "--port", "3000"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🎮 Usage

### Command Line Options

```bash
randsum-mcp [options]

Options:
  --transport <stdio|http>  Transport type (default: stdio)
  --port <number>          HTTP port (default: 3000)
  --host <string>          HTTP host (default: localhost)
  --verbose                Enable verbose logging
  --help                   Show help message
```

### Available Tools

Once configured, the following tools will be available in your MCP client:

#### 1. **roll**

- **Description**: Roll dice using RANDSUM notation (e.g., "2d20+5", "4d6L")
- **Parameters**:
  - `notation` (string, required): Dice notation string (e.g., "2d20+5", "4d6L", "3d8!")
- **Returns**: Detailed roll results including total, individual dice results, and roll breakdown

#### 2. **validate-notation**

- **Description**: Validate dice notation and get helpful feedback
- **Parameters**:
  - `notation` (string, required): Dice notation string to validate
- **Returns**: Validation status with detailed feedback and error descriptions

#### 3. **game-roll**

- **Description**: Roll dice using game-specific mechanics (5e, Blades, Daggerheart, Salvage Union)
- **Parameters**:
  - `game` (string, required): Game system - one of: `5e`, `blades`, `daggerheart`, `salvageunion`
  - `modifier` (number, optional): Modifier to add to the roll (for 5e and Daggerheart)
  - `rollingWith` (string, optional): `Advantage` or `Disadvantage` (5e and Daggerheart)
  - `dicePool` (number, optional): Number of dice in pool 1-10 (for Blades in the Dark)
  - `tableName` (string, optional): Table name for Salvage Union rolls (e.g., "Core Mechanic", "Critical Damage")
  - `dc` (number, optional): Difficulty Class 1-30 (for 5e and Daggerheart)
- **Returns**: Game-specific roll results with appropriate formatting and success/failure indicators

### Available Resources

#### **dice-notation-docs**

- **URI**: `randsum://dice-notation-docs`
- **Type**: `text/markdown`
- **Description**: Complete reference for RANDSUM dice notation syntax and modifiers
- **Content**: Comprehensive documentation covering:
  - Basic syntax (`NdS`, `NdS+X`, `NdS-X`)
  - Modifiers (`L` drop lowest, `H` keep highest, `R{<N}` reroll, `!` exploding, `U` unique)
  - Examples and usage patterns
  - Custom dice notation (`2d{HT}`, `3d{ABC}`)

## 📖 Examples

### Basic Dice Rolling

Ask your MCP client to:

- "Roll 2d6+3"
- "Roll 4d6 drop lowest"
- "Roll 1d20 with advantage"

### Advanced Rolling

- "Roll 3d6 exploding on 6"
- "Roll 2d10 + 1d6 fire damage"
- "Validate the notation '2d6+1d4'"

## 🔧 Troubleshooting

### Server Won't Start

1. Ensure Node.js 18+ is installed
2. Check that the package is properly installed
3. Verify MCP configuration syntax

### Tools Not Available

1. Restart your MCP client after configuration changes
2. Check the MCP client logs for connection errors
3. Test the server manually: `npx @randsum/mcp --help`

### HTTP Mode Issues

1. Ensure the specified port is available
2. Check firewall settings if accessing remotely
3. Use `--verbose` flag for detailed logging

## 🆘 Support

For issues and questions:

- GitHub: https://github.com/RANDSUM/randsum
- Documentation: https://randsum.org

## 🔗 Related Packages

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/corePackages/dice): Core dice rolling
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/corePackages/notation): Dice notation parser

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
