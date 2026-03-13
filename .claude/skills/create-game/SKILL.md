---
name: create-game
description: Add a new game to @randsum/games
disable-model-invocation: true
---

# Add a New Game to @randsum/games

Games live as subpath exports inside `packages/games/`. No separate package needed.

## Gather Information

Ask the user for:
1. **Game name** and **shortcode** (kebab-case, e.g. `mothership`)
2. **Brief description** of the dice mechanics
3. **Core dice** used (e.g. d6 pool, 2d6+stat, d20, d100)
4. **Result interpretation** (outcomes, thresholds, special results)

## Steps

1. **Write the spec**: Create `packages/games/<shortcode>.randsum.json` following the schema at `packages/gameSchema/randsum.json`
2. **Run codegen**: `bun run --filter @randsum/games codegen` — generates `packages/games/src/<shortcode>.generated.ts`
3. **Add exports**: Add `".<shortcode>"` entry to `packages/games/package.json` exports map (following existing pattern)
4. **Write tests**: Add `packages/games/__tests__/<shortcode>.test.ts` and `<shortcode>.property.test.ts`
5. **Add size limit**: Add entry to root `package.json` `size-limit` array: `dist/<shortcode>.generated.js` with appropriate KB limit
6. **Verify**: `bun run --filter @randsum/games test && bun run --filter @randsum/games build`

## Key Constraints

- All game logic lives in the `.randsum.json` spec — no hand-written TypeScript in generated files
- Generated files are checked into git
- Runtime dep: `@randsum/roller` only
- Bundle size limit: 8KB per subpath (300KB for salvageunion due to baked-in table data)
