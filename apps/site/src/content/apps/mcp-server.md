---
title: "RANDSUM MCP Server"
description: "Model Context Protocol server for AI assistants to perform dice rolling"
category: "server"
status: "active"
version: "1.0.0"
platform: ["node"]
installation: "npm"
hasUserGuide: true
hasApiDocs: true
hasExamples: true
githubPath: "apps/mcp"
tags: ["mcp", "ai", "server", "protocol"]
order: 1
license: "MIT"
---

# RANDSUM MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to perform advanced dice rolling using the RANDSUM library.

## Overview

The RANDSUM MCP Server provides AI assistants with sophisticated dice rolling capabilities through the Model Context Protocol. This allows AI models to execute complex dice notation, validate syntax, and provide detailed roll breakdowns in conversational contexts.

## Installation

### Via npm

```bash
npm install -g @randsum/mcp-server
```

### From Source

```bash
git clone https://github.com/RANDSUM/randsum.git
cd randsum/apps/mcp
npm install
npm run build
npm link
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "randsum": {
      "command": "randsum-mcp-server",
      "args": []
    }
  }
}
```

### Other MCP Clients

The server follows the standard MCP protocol and should work with any compliant client:

```bash
randsum-mcp-server
```

## Available Tools

### `roll`

Execute dice rolls using RANDSUM notation.

**Parameters:**
- `notation` (string): Valid RANDSUM dice notation

**Example:**
```json
{
  "name": "roll",
  "arguments": {
    "notation": "2d6+3"
  }
}
```

**Response:**
```json
{
  "total": 11,
  "dice": [4, 4],
  "notation": "2d6+3",
  "breakdown": "2d6+3: [4, 4] + 3 = 11"
}
```

### `validate-notation`

Validate dice notation syntax without executing the roll.

**Parameters:**
- `notation` (string): Dice notation to validate

**Example:**
```json
{
  "name": "validate-notation",
  "arguments": {
    "notation": "4d6L"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "notation": "4d6L",
  "description": "Roll 4d6, drop lowest"
}
```

## Usage Examples

### Basic Rolling

AI Assistant can now perform dice rolls:

```
User: "Roll 2d6 for damage"
AI: I'll roll 2d6 for damage.

[Uses roll tool with notation "2d6"]

The damage roll is 8 (rolled 3 and 5 on the two dice).
```

### Complex Notation

```
User: "Generate D&D ability scores using 4d6 drop lowest"
AI: I'll generate six ability scores using 4d6 drop lowest for each.

[Uses roll tool multiple times with notation "4d6L"]

Your ability scores are:
- Strength: 15 (rolled [6,4,3,2], dropped 2)
- Dexterity: 12 (rolled [4,3,3,2], dropped 2)
- Constitution: 16 (rolled [6,6,2,2], dropped 2)
- Intelligence: 13 (rolled [5,4,2,2], dropped 2)
- Wisdom: 14 (rolled [6,3,3,2], dropped 2)
- Charisma: 11 (rolled [4,3,2,2], dropped 2)
```

### Validation

```
User: "Is '3d6X' valid dice notation?"
AI: Let me check that notation for you.

[Uses validate-notation tool]

No, '3d6X' is not valid RANDSUM notation. The 'X' modifier is not recognized. 
Valid modifiers include L (drop lowest), H (drop highest), R{} (reroll), 
! (exploding), and others.
```

## Advanced Features

### Game System Integration

The server supports all RANDSUM packages:

```json
{
  "name": "roll",
  "arguments": {
    "notation": "3d6",
    "system": "blades"
  }
}
```

### Batch Operations

Multiple rolls in a single request:

```json
{
  "name": "roll-batch",
  "arguments": {
    "rolls": [
      {"notation": "1d20+5", "label": "Attack"},
      {"notation": "1d8+3", "label": "Damage"}
    ]
  }
}
```

## Configuration Options

### Environment Variables

- `RANDSUM_MCP_PORT` - Server port (default: auto)
- `RANDSUM_MCP_LOG_LEVEL` - Logging level (debug, info, warn, error)
- `RANDSUM_MCP_MAX_DICE` - Maximum dice per roll (default: 100)

### Config File

Create `randsum-mcp.config.json`:

```json
{
  "maxDice": 100,
  "allowCustomFaces": true,
  "logLevel": "info",
  "enableBatch": true
}
```

## Security Considerations

- The server validates all input notation
- Maximum dice limits prevent resource exhaustion
- No file system or network access beyond MCP protocol
- Runs in isolated process context

## Troubleshooting

### Common Issues

**Server not starting:**
```bash
# Check if port is available
netstat -an | grep :PORT

# Run with debug logging
RANDSUM_MCP_LOG_LEVEL=debug randsum-mcp-server
```

**Invalid notation errors:**
- Use `validate-notation` tool to check syntax
- Refer to [Dice Notation Guide](/docs/dice-notation)

**Performance issues:**
- Reduce `maxDice` configuration
- Avoid excessive batch operations

## Development

### Building from Source

```bash
cd apps/mcp
npm install
npm run build
npm test
```

### Running Tests

```bash
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:mcp          # MCP protocol tests
```

## See Also

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [RANDSUM Core Documentation](/packages/roller)
- [Dice Notation Reference](/docs/dice-notation)
