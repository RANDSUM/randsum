# @randsum/skill - Agent Skill Package

## Overview

This package provides an [Agent Skill](https://agentskills.io) that enables AI agents to perform dice rolling and tabletop RPG mechanics using the RANDSUM ecosystem.

## Package Structure

```
packages/skill/
├── SKILL.md              # Main Agent Skill definition (required by spec)
├── references/           # Additional documentation for progressive disclosure
│   ├── notation.md       # Complete dice notation reference
│   └── game-systems.md   # Game-specific mechanics guide
├── package.json          # NPM package configuration
├── README.md             # Package documentation
├── LICENSE               # MIT license
└── AGENTS.md             # This file
```

## Agent Skills Specification

This package follows the [Agent Skills specification](https://agentskills.io/specification):

- **SKILL.md**: Contains YAML frontmatter with `name`, `description`, and `metadata`, followed by Markdown instructions
- **references/**: Optional directory for additional documentation loaded on demand
- **Progressive disclosure**: Agents load metadata first, then full instructions, then references as needed

## Key Files

### SKILL.md

The main skill definition containing:

- Activation triggers (when to use this skill)
- Core dice notation reference
- Game system support overview
- Implementation options (MCP, CLI, programmatic)
- Best practices and example interactions

### references/notation.md

Complete RANDSUM dice notation reference including:

- All modifier types (drop, reroll, explode, unique, cap, replace)
- Combining modifiers
- Common patterns for different game systems

### references/game-systems.md

Detailed mechanics for supported game systems:

- D&D 5th Edition (@randsum/fifth)
- Blades in the Dark (@randsum/blades)
- Daggerheart (@randsum/daggerheart)
- Root RPG (@randsum/root-rpg)
- Salvage Union (@randsum/salvageunion)

## No Build Required

This package contains only Markdown documentation - no TypeScript compilation needed. The `package.json` scripts are minimal stubs for monorepo compatibility.

## Publishing

When published to npm, includes:

- `SKILL.md`
- `references/` directory
- `README.md`
- `LICENSE`

Agents can reference this skill directly from npm or by copying the files into a skills directory.
