<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/gameSchema</h1>
  <h3>Dice mechanic spec format for <a href="https://github.com/RANDSUM/randsum">@RANDSUM</a></h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/gameSchema)](https://www.npmjs.com/package/@randsum/gameSchema)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/gameSchema)](https://bundlephobia.com/package/@randsum/gameSchema)
[![Types](https://img.shields.io/npm/types/@randsum/gameSchema)](https://www.npmjs.com/package/@randsum/gameSchema)
[![License](https://img.shields.io/npm/l/@randsum/gameSchema)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/gameSchema)](https://www.npmjs.com/package/@randsum/gameSchema)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

Build tool for the **randsum dice mechanic spec format** (`.randsum.json`). Write your game's dice mechanics once as a declarative JSON spec, then generate type-safe TypeScript roll functions, validate specs, and load them at runtime.

## Installation

```bash
npm install @randsum/gameSchema
# or
bun add @randsum/gameSchema
```

## The Spec Format

A `.randsum.json` file is a declarative description of a game's dice mechanics — dice pools, modifiers, resolution, and outcomes — as a four-stage pipeline: **Dice → Modify → Resolve → Outcome**.

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "My Game",
  "shortcode": "my-game",
  "game_url": "https://example.com/my-game",
  "pools": {
    "d6": { "sides": 6 }
  },
  "tables": {
    "result": {
      "ranges": [
        { "exact": 6, "result": "hit" },
        { "min": 1, "max": 5, "result": "miss" }
      ]
    }
  },
  "roll": {
    "inputs": {
      "count": { "type": "integer", "minimum": 1, "default": 1 }
    },
    "dice": { "pool": { "$ref": "#/pools/d6" }, "quantity": { "$input": "count" } },
    "modify": [{ "keepHighest": 1 }],
    "resolve": "sum",
    "outcome": { "tableLookup": { "$ref": "#/tables/result" } }
  }
}
```

Add the VS Code JSON schema reference for autocomplete:

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json"
}
```

## Code Generation

Generate type-safe TypeScript roll functions from a spec at build time.

### API

```typescript
import { generateCode } from "@randsum/gameSchema"
import spec from "./my-game.randsum.json"

// Write generated TypeScript to a directory, returns the output filepath
const filepath = generateCode(spec, "./src")

// Return the generated code as a string (no file write)
const code = generateCode(spec)
```

The generated file is named `{spec.shortcode}.ts` and exports typed roll functions:

```typescript
// Generated: my-game.ts
export type RollResult = "hit" | "miss"
export function roll(input?: { count?: number }): GameRollResult
```

### CLI

```bash
# Generate TypeScript from a spec file
bun run codegen -- my-game.randsum.json ./src

# Or via the scripts/codegen.ts helper
bun scripts/codegen.ts my-game.randsum.json ./src
```

### bunup Integration

Call `generateCode` as a side effect in `bunup.config.ts` so the generated file is written before bundling:

```typescript
import { generateCode } from "@randsum/gameSchema"
import { defineConfig } from "bunup"
import spec from "./my-game.randsum.json"

generateCode(spec, ".")

export default defineConfig({
  entry: [`./${spec.shortcode}.ts`],
  format: ["esm", "cjs"],
  dts: true,
  external: ["@randsum/gameSchema"]
})
```

## Validation

Validate any spec file against the JSON Schema. Useful in CI, pre-commit hooks, or as part of a build pipeline.

### API

```typescript
import { validateSpec } from "@randsum/gameSchema"
import spec from "./my-game.randsum.json"

const result = validateSpec(spec)

if (result.valid) {
  console.log("Spec is valid")
} else {
  for (const err of result.errors) {
    console.error(`${err.path}: ${err.message}`)
  }
}
```

```typescript
type ValidationResult = { valid: true } | { valid: false; errors: readonly ValidationError[] }

interface ValidationError {
  path: string // JSON path to the invalid field (e.g. '/roll/dice')
  message: string // Human-readable error description
}
```

### CLI

After installing the package:

```bash
# Validate one or more spec files
randsum-schema-validate my-game.randsum.json
randsum-schema-validate specs/*.randsum.json

# Or run directly via bun (from within the package)
bun run validate -- my-game.randsum.json
```

Exit code is `0` for a valid spec, `1` on any validation error.

## Runtime Loader

Load and parse a spec at runtime — useful for tools, editors, or server-side apps.

```typescript
import { loadSpec, loadSpecAsync } from '@randsum/gameSchema'

// Synchronous (accepts a parsed object or file path string)
const spec = loadSpec('./my-game.randsum.json')
const spec2 = loadSpec({ name: 'My Game', shortcode: 'my-game', ... })

// Async
const spec3 = await loadSpecAsync('./my-game.randsum.json')
```

## JSON Schema

The raw JSON Schema is published and can be referenced directly:

```bash
https://randsum.dev/schemas/v1/randsum.json
```

Or imported from the package:

```typescript
import schema from "@randsum/gameSchema/randsum.json"
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling engine
- [@randsum/blades](https://github.com/RANDSUM/randsum/tree/main/games/blades): Blades in the Dark — an example of a game built with this toolchain

<div align="center">
Made with by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
