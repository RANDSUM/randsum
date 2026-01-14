<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/skill</h1>
  <h3>Agent Skill for RANDSUM dice rolling and tabletop RPG mechanics</h3>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-blue.svg)](https://agentskills.io)

## Overview

This package provides an [Agent Skill](https://agentskills.io) that gives AI agents comprehensive dice rolling capabilities using the RANDSUM ecosystem.

## What is an Agent Skill?

Agent Skills are portable packages of instructions and resources that AI agents can discover and use to perform tasks more accurately. This skill enables agents to:

- Roll dice using advanced RANDSUM notation
- Understand game-specific mechanics (D&D 5E, Blades in the Dark, etc.)
- Validate dice notation syntax
- Provide contextual help for tabletop RPG scenarios

## Skill Contents

```
@randsum/skill/
├── SKILL.md              # Main skill definition
├── references/
│   ├── notation.md       # Complete dice notation reference
│   └── game-systems.md   # Game-specific mechanics guide
└── README.md             # This file
```

## Compatible Agents

This skill follows the [Agent Skills specification](https://agentskills.io/specification) and is compatible with:

- Claude (Anthropic)
- Cursor
- Other skills-compatible AI tools

## Usage

### For AI Agents

The skill is automatically discovered when placed in a skills directory. The agent reads `SKILL.md` to understand capabilities and loads reference files as needed.

### For Developers

Install as a reference in your project:

```bash
npm install @randsum/skill
```

### For Direct Integration

Use with the RANDSUM MCP server for tool-based integration:

```json
{
  "mcpServers": {
    "randsum": {
      "command": "npx",
      "args": ["-y", "@randsum/mcp@latest"]
    }
  }
}
```

## Capabilities

### Dice Notation

Full RANDSUM notation support including:

- Basic rolls: `2d6`, `1d20+5`
- Drop modifiers: `4d6L` (drop lowest)
- Reroll conditions: `4d6R{1}` (reroll 1s)
- Exploding dice: `3d6!`
- Unique results: `4d20U`
- Capping: `4d20C{>18}`

### Game Systems

Built-in knowledge of:

- **D&D 5th Edition**: Advantage, disadvantage, ability scores
- **Blades in the Dark**: Action rolls, position/effect
- **Daggerheart**: Hope/Fear dice system
- **Root RPG**: PbtA 2d6+stat mechanics
- **Salvage Union**: Roll-under d20 system

## Related Packages

| Package                                                                      | Description                   |
| ---------------------------------------------------------------------------- | ----------------------------- |
| [@randsum/roller](https://www.npmjs.com/package/@randsum/roller)             | Core dice rolling engine      |
| [@randsum/mcp](https://www.npmjs.com/package/@randsum/mcp)                   | MCP server for AI integration |
| [@randsum/fifth](https://www.npmjs.com/package/@randsum/fifth)               | D&D 5E mechanics              |
| [@randsum/blades](https://www.npmjs.com/package/@randsum/blades)             | Blades in the Dark            |
| [@randsum/daggerheart](https://www.npmjs.com/package/@randsum/daggerheart)   | Daggerheart RPG               |
| [@randsum/root-rpg](https://www.npmjs.com/package/@randsum/root-rpg)         | Root RPG                      |
| [@randsum/salvageunion](https://www.npmjs.com/package/@randsum/salvageunion) | Salvage Union                 |

## Links

- [Agent Skills Specification](https://agentskills.io/specification)
- [RANDSUM GitHub](https://github.com/RANDSUM/randsum)
- [Dice Notation Documentation](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md)

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
