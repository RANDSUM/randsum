<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/mcp</h1>
  <h3>Model Context Protocol server for RANDSUM dice rolling and game mechanics</h3>
</div>

[![npm version](https://img.shields.io/npm/v/@randsum/mcp.svg)](https://www.npmjs.com/package/@randsum/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/RANDSUM/randsum/commits/main)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

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

#### 1. **roll** - Advanced Dice Rolling Engine

- **Description**: Execute sophisticated dice rolls using RANDSUM's comprehensive notation system with detailed breakdowns
- **Parameters**:
  - `notation` (string, required): RANDSUM dice notation string supporting:
    - **Basic rolls**: `2d6`, `1d20+5`, `4d8-2`
    - **Drop modifiers**: `4d6L` (drop lowest), `2d20H` (drop highest), `4d6LH` (drop both extremes)
    - **Reroll conditions**: `4d6R{1}` (reroll 1s), `4d6R{<3}` (reroll under 3), `4d6R{1,2,6}` (reroll specific values)
    - **Exploding dice**: `3d6!` (explode on maximum), `2d10!` (cascade rolling)
    - **Unique results**: `4d20U` (all different results), `5d6U` (no duplicates)
    - **Value capping**: `4d20C{>18}` (cap maximum), `4d6C{<2,>5}` (enforce ranges)
    - **Complex combinations**: `4d6LR{1}!+3` (drop lowest, reroll 1s, exploding, add 3)
- **Returns**: Comprehensive roll breakdown including:
  - Final total and roll type classification
  - Raw die results before modifier application
  - Modified results after all modifiers applied
  - Detailed subtotals for each roll group
  - Step-by-step modifier application explanation

#### 2. **validate-notation** - Syntax Validator & Parser

- **Description**: Validate RANDSUM dice notation syntax with comprehensive error feedback and parsing details
- **Parameters**:
  - `notation` (string, required): Any potential RANDSUM dice notation string to validate
- **Returns**: Detailed validation results including:
  - **Valid notation**: Parsed structure showing quantity, sides, and modifiers
  - **Invalid notation**: Specific error messages with correction guidance
  - **Learning aid**: Explanation of how notation will be interpreted
  - **Error prevention**: Common mistakes and suggested alternatives

### Available Resources

#### **dice-notation-docs** - Complete Notation Reference

- **URI**: `randsum://dice-notation-docs`
- **Type**: `text/markdown`
- **Description**: Comprehensive reference for RANDSUM dice notation syntax and modifiers
- **Source**: Battle-tested documentation with verified examples from systematic testing
- **Content**: Complete documentation covering:
  - Basic syntax (`NdS`, `NdS+X`, `NdS-X`) with edge cases
  - Advanced modifiers (`L` drop lowest, `H` keep highest, `R{<N}` reroll, `!` exploding, `U` unique)
  - Complex conditions (`C{>N}` capping with range enforcement)
  - Modifier combinations and advanced examples
  - Gaming applications (D&D, Pathfinder, narrative games)
  - Error patterns and troubleshooting guidance
  - LLM integration best practices and usage patterns

> **Note**: The documentation is fetched live from the RANDSUM repository, ensuring you always have access to the most up-to-date notation reference.

## 📚 RANDSUM Dice Notation Reference

The RANDSUM MCP server supports the full RANDSUM dice notation system. For complete documentation of all available syntax and modifiers, see:

**🔗 [RANDSUM Dice Notation Documentation](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md)**

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
- Documentation: https://github.com/RANDSUM/randsum/blob/main/README.md

## 🔗 Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
