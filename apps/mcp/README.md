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

- **Advanced Dice Rolling**: Full RANDSUM notation support with complex modifiers
- **Dice Notation Validation**: Validate and explain dice notation syntax with detailed feedback
- **Documentation Resources**: Built-in access to complete dice notation reference
- **Type Safety**: Full TypeScript support with intelligent type inference
- **Multiple Transport Modes**: STDIO, HTTP, and SSE transport support
- **Detailed Roll Breakdowns**: Individual die results, modifier applications, and totals

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

### MCP Client Configuration

Add the RANDSUM MCP server to your MCP client configuration. Below are copy-pastable JSON examples for different transport modes.

**Configuration File Locations:**

- **Claude Desktop**:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- **Other MCP Clients**: Refer to your client's documentation for configuration file location

### STDIO Transport (Default)

Standard input/output transport - recommended for most use cases:

```json
{
  "mcpServers": {
    "randsum": {
      "command": "npx",
      "args": ["-y", "@randsum/mcp@latest"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### SSE Transport (Server-Sent Events)

For web-based clients or when you need persistent connections:

```json
{
  "mcpServers": {
    "randsum-sse": {
      "command": "npx",
      "args": ["-y", "@randsum/mcp@latest", "--transport", "sse", "--port", "3001"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### HTTP Transport

For REST API access or debugging purposes:

```json
{
  "mcpServers": {
    "randsum-http": {
      "command": "npx",
      "args": ["-y", "@randsum/mcp@latest", "--transport", "http", "--port", "3000"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Advanced Configuration Options

You can customize the server with additional options:

```json
{
  "mcpServers": {
    "randsum-custom": {
      "command": "npx",
      "args": [
        "-y",
        "@randsum/mcp@latest",
        "--transport",
        "http",
        "--port",
        "8080",
        "--host",
        "0.0.0.0",
        "--verbose"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🎮 Usage

### Command Line Options

```bash
npx -y @randsum/mcp@latest [options]

Options:
  --transport <stdio|sse|http>  Transport type (default: stdio)
  --port <number>               Port for SSE/HTTP transports (default: 3000)
  --host <string>               Host for SSE/HTTP transports (default: localhost)
  --verbose                     Enable verbose logging
  --help                        Show help message
```

### Available Tools

Once configured, the following tools will be available in your MCP client:

#### 1. **roll** - Advanced Dice Rolling

- **Description**: Execute dice rolls using RANDSUM's comprehensive notation system
- **Parameters**:
  - `notation` (string, required): Dice notation string supporting:
    - Basic rolls: `2d6`, `4d20+5`, `3d8-2`
    - Drop modifiers: `4d6L` (drop lowest), `2d20H` (drop highest)
    - Reroll conditions: `4d6R{<3}` (reroll under 3), `6d6R{1,2}` (reroll 1s and 2s)
    - Exploding dice: `3d6!` (explode on max), `4d10!{>8}` (explode on 9-10)
    - Unique results: `4d20U` (all unique), `5d6U{1,6}` (unique except 1s and 6s)
    - Value capping: `4d20C{>18}` (cap over 18), `6d6C{<2}` (cap under 2)
    - Custom faces: `2d{HT}` (heads/tails), `4d{ABCD}` (custom symbols)
    - Complex combinations: `4d6LR{<2}+5` (drop lowest, reroll under 2, add 5)
- **Returns**: Comprehensive roll breakdown including:
  - Final total and roll type
  - Individual die results (raw and modified)
  - Applied modifiers and their effects
  - Detailed step-by-step calculation

#### 2. **validate-notation** - Syntax Validation

- **Description**: Validate RANDSUM dice notation and receive detailed feedback
- **Parameters**:
  - `notation` (string, required): Any dice notation string to validate
- **Returns**: Validation results including:
  - Syntax correctness (valid/invalid)
  - Detailed error messages with specific issues
  - Suggestions for corrections
  - Examples of proper usage

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

#### **dice-notation-docs** - Complete Notation Reference

- **URI**: `randsum://dice-notation-docs`
- **Type**: `text/markdown`
- **Description**: Complete reference for RANDSUM dice notation syntax and modifiers
- **Source**: Fetched live from [GitHub](https://github.com/RANDSUM/randsum/blob/main/corePackages/notation/RANDSUM_DICE_NOTATION.md)
- **Content**: Comprehensive documentation covering:
  - Basic syntax (`NdS`, `NdS+X`, `NdS-X`)
  - Advanced modifiers (`L` drop lowest, `H` keep highest, `R{<N}` reroll, `!` exploding, `U` unique)
  - Complex conditions (`C{>N}` capping, `V{<N=X}` value replacement)
  - Custom dice notation (`2d{HT}`, `3d{ABC}`)
  - Modifier combinations and examples
  - TypeScript API usage patterns

> **Note**: The documentation is fetched live from the RANDSUM repository, ensuring you always have access to the most up-to-date notation reference.

## 📚 RANDSUM Dice Notation Reference

The RANDSUM MCP server supports the full RANDSUM dice notation system. For complete documentation of all available syntax and modifiers, see:

**🔗 [RANDSUM Dice Notation Documentation](https://github.com/RANDSUM/randsum/blob/main/corePackages/notation/RANDSUM_DICE_NOTATION.md)**

### Quick Reference

| Notation   | Description              | Example                           |
| ---------- | ------------------------ | --------------------------------- |
| `NdS`      | Roll N dice with S sides | `2d6` (roll 2 six-sided dice)     |
| `NdS+X`    | Add modifier             | `2d6+3` (roll 2d6, add 3)         |
| `NdSL`     | Drop lowest              | `4d6L` (roll 4d6, drop lowest)    |
| `NdSH`     | Drop highest             | `2d20H` (roll 2d20, drop highest) |
| `NdS!`     | Exploding dice           | `3d6!` (reroll on max value)      |
| `NdSR{<N}` | Reroll condition         | `4d6R{<3}` (reroll under 3)       |
| `NdSU`     | Unique results           | `4d20U` (all results unique)      |
| `NdSC{>N}` | Cap values               | `4d20C{>18}` (cap over 18)        |
| `Nd{XYZ}`  | Custom faces             | `2d{HT}` (heads/tails coin)       |

### Complex Examples

- `4d6LR{<2}+2` - Roll 4d6, reroll under 2, drop lowest, add 2
- `2d20H!+5` - Roll 2d20 with exploding, drop highest, add 5
- `6d6U{1,6}C{>5}` - Roll 6d6 unique (except 1s/6s), cap over 5

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

### SSE/HTTP Mode Issues

1. Ensure the specified port is available
2. Check firewall settings if accessing remotely
3. Use `--verbose` flag for detailed logging
4. For SSE mode, ensure your client supports Server-Sent Events

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
