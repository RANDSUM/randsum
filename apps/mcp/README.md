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

## 🚀 Quick Start

### Installation

```bash
npm install @randsum/mcp
# or
yarn add @randsum/mcp
# or
bun add @randsum/mcp
```

### Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "randsum": {
      "command": "node",
      "args": ["/path/to/node_modules/@randsum/mcp/dist/index.js"]
    }
  }
}
```

### Available Tools

- **roll**: Generate dice rolls using RANDSUM notation
- **validate-notation**: Validate dice notation and get helpful feedback

### Available Resources

- **dice-notation-docs**: Complete RANDSUM dice notation reference

## 📖 Examples

```typescript
// Roll basic dice
roll('2d20+5')

// Validate notation
validateNotation('4d6L')
```

## 🔗 Related Packages

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/corePackages/dice): Core dice rolling
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/corePackages/notation): Dice notation parser

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
