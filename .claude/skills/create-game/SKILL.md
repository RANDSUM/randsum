---
name: create-game
description: Scaffold a new game package for a tabletop RPG system
disable-model-invocation: true
---

# Create Game Package

Guided scaffold for a new @randsum game package.

## Gather Information

Ask the user for:
1. **Game name** (kebab-case, e.g. `mothership`)
2. **Brief description** of the game's dice mechanics (e.g. "d100 roll-under with stress dice")
3. **Core dice** used (e.g. d6 pool, 2d6+stat, d20, d100)
4. **Result interpretation** (what outcomes mean - success/failure thresholds, special results)

## Scaffold

Run: `bun run create:game <name>`

This creates the package structure at `games/<name>/`.

## Post-scaffold Guidance

After the script runs:

1. **Verify structure**: confirm `games/<name>/` has `src/`, `__tests__/`, `package.json`, `CLAUDE.md`
2. **Install deps**: `bun install` to link workspace dependencies
3. **Implement types**: Edit `src/types.ts` with game-specific result types based on the user's description
4. **Implement roll function**: Edit `src/roll<GameName>/index.ts` using the `createGameRoll` factory:
   ```typescript
   createGameRoll<TInput, TResult>({
     validate: (input) => { ... },
     toRollOptions: (input) => { ... },
     interpretResult: (input, total, rolls, fullResult) => TResult
   })
   ```
5. **Write tests**: Add tests in `__tests__/` following existing game package patterns (see `games/blades/__tests__/` or `games/fifth/__tests__/` for examples)
6. **Add size limit**: Add entry to root `package.json` `size-limit` array with 7KB limit
7. **Verify**: `bun run --filter @randsum/<name> test && bun run --filter @randsum/<name> build`

## Key Constraints

- Game packages depend ONLY on `@randsum/roller` via `workspace:~`
- Never depend on other game packages
- Use `createGameRoll` factory from roller
- Bundle size limit: 7KB
- Follow `const`-only, `import type`, no `any` conventions
