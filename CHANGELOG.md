# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-01

The first stable release of the RANDSUM dice rolling ecosystem.

### Packages

#### @randsum/roller

The core dice rolling engine with comprehensive notation support.

- `roll()` function supporting numbers, notation strings, and options objects
- Full dice notation parsing with modifiers (drop, keep, reroll, explode, etc.)
- `notation()` and `validateNotation()` for notation validation
- `analyze()` for probability analysis
- Custom error classes with detailed error codes
- Dual ESM/CJS exports with full TypeScript definitions

#### @randsum/blades

Blades in the Dark dice mechanics.

- `rollBlades()` for pool-based d6 rolling
- Returns outcomes: critical, success, partial, or failure

#### @randsum/daggerheart

Daggerheart RPG system support.

- `rollDaggerheart()` for Hope/Fear dual-d12 mechanics
- Advantage/disadvantage support

#### @randsum/fifth

D&D 5th Edition mechanics.

- `actionRoll()` for d20 + modifier rolls
- Advantage/disadvantage support

#### @randsum/pbta

Powered by the Apocalypse mechanics.

- `rollPbtA()` for 2d6 + stat modifier rolls
- Standard PbtA outcome thresholds

#### @randsum/root-rpg

Root RPG system implementation.

- `rollRootRpg()` for Root-specific dice mechanics

#### @randsum/salvageunion

Salvage Union mechanics.

- `rollTable()` for table-based dice lookups
- Pre-configured Salvage Union reference tables

#### @randsum/mcp

Model Context Protocol server for AI integration.

- Multiple transport modes: stdio, http, sse
- Exposes all game system rolling as MCP tools
- CLI: `npx randsum-mcp`
