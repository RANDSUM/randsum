---
name: codegen
description: Regenerate and verify game package TypeScript from .randsum.json specs
disable-model-invocation: true
---

# Codegen Game Packages

Regenerate TypeScript from `.randsum.json` specs in `packages/games/`.

## Available Specs

List specs to confirm what will be regenerated:

```bash
ls packages/games/*.randsum.json
```

Current games: `blades`, `daggerheart`, `fifth`, `pbta`, `root-rpg`, `salvageunion`

## Steps

Run these sequentially, stopping on any failure:

1. **Regenerate all**: `bun run --filter @randsum/games gen`
2. **Verify no drift**: `bun run --filter @randsum/games gen:check` — fails if generated files differ from checked-in versions
3. **Run tests**: `bun run --filter @randsum/games test`
4. **Check bundle sizes**: `bun run --filter @randsum/games size`

## Key Constraints

- Generated files (`src/<shortcode>.generated.ts`) are checked into git
- All game logic lives in the `.randsum.json` spec — never hand-edit generated files
- Bundle size limit: 8KB per subpath (300KB for salvageunion)
- If `gen:check` fails after `gen`, the generated files have changed — review the diff and commit if intentional
