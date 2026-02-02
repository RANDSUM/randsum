# RANDSUM Monorepo

## Architecture

This is a Bun workspace monorepo containing dice rolling packages for tabletop RPGs.

**Core Package:**

- `@randsum/roller` - Core dice rolling engine with advanced notation support

**Game Packages** (all depend on `@randsum/roller`):

- `@randsum/blades` - Blades in the Dark system mechanics
- `@randsum/daggerheart` - Daggerheart RPG system support
- `@randsum/fifth` - D&D 5th Edition mechanics
- `@randsum/root-rpg` - Root RPG system implementation
- `@randsum/salvageunion` - Salvage Union mechanics

**Tools & Applications:**

- `@randsum/mcp` - Model Context Protocol server for AI integration
- `@randsum/site` - Documentation and marketing website (Astro)

## Development Commands

```bash
bun install          # Install all dependencies
bun run build        # Build all packages
bun run test         # Run all tests
bun run lint         # Lint all packages
bun run format       # Format all packages
bun run typecheck    # Type check all packages
bun run check:all    # Full CI pipeline (lint, format, typecheck, test, site build)
```

## TypeScript Conventions

- Strict mode enabled globally (`tsconfig.json`)
- Use `type` imports: `import type { X } from 'package'`
- Export types separately from implementations
- Explicit return types on exported functions
- PascalCase for types/interfaces, camelCase for functions
- No `any` - use `unknown` if type is truly unknown

## Package Patterns

### Build Output

All packages produce ESM + CJS dual packages:

- `dist/index.js` (ESM)
- `dist/index.cjs` (CommonJS)
- `dist/index.d.ts` and `dist/index.d.cts` (type definitions)

### Dependencies

- Internal dependencies use `workspace:~` version specifier
- Game packages depend on `@randsum/roller`
- All packages specify `engines.node` and `engines.bun` requirements

### Testing

- Use `bun:test` (describe, expect, test)
- Test files in `__tests__/` directories
- Stress tests use 9999 iterations
- Test boundary conditions and error cases

## Dice Notation

Complete reference: `packages/roller/RANDSUM_DICE_NOTATION.md`

`roll()` accepts a number (sides for 1 die), a notation string, an options object, or multiple arguments:

- `roll(20)` - Number: roll 1d20
- `roll("2d6")` - Notation: roll 2 six-sided dice
- `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })` - Object: same as 4d6L
- `roll("1d20", "2d6", "+5")` - Multiple: combine rolls (attack + damage + modifier)
- `roll("4d6L")` - Roll 4d6, drop lowest (D&D ability scores)
- `roll("2d20H")` - Roll 2d20, keep highest (advantage)
- `roll("1d20+5")` - Roll 1d20, add 5

## Development Guidelines

Detailed development documentation is in the [AGENTS/](AGENTS/) directory:

- [Scripts Reference](AGENTS/scripts.md) - All available development commands and workflows
- [Game Package Patterns](AGENTS/game-packages.md) - Creating and structuring game packages
- [Modifier System Patterns](AGENTS/modifiers.md) - Adding and implementing modifiers in @randsum/roller
- [Testing Patterns](AGENTS/testing.md) - Test structure, stress testing, and assertions

Run `bun run help` for a quick command reference.

## File Structure

```text
packages/
  {package-name}/
    src/
      index.ts           # Main exports
      types.ts           # Type definitions
      {feature}/         # Feature implementations
    __tests__/           # Test files
    dist/                # Build output (gitignored)
    package.json
    tsconfig.json        # Extends ../../tsconfig.packages.json
```

## Common Development Tasks

### Adding a New Game System Package

1. **Copy template**: Use `packages/salvageunion/` as the simplest template

   ```bash
   cp -r packages/salvageunion packages/{new-game}
   ```

2. **Update package.json**:
   - Change `name` to `@randsum/{new-game}`
   - Update `description` and `keywords`
   - Ensure `@randsum/roller` is in dependencies with `workspace:~`

3. **Implement roll function**:
   - Import `roll` from `@randsum/roller` in `src/roll{GameName}/index.ts`
   - Create wrapper that interprets results for the game system
   - Return `GameRollResult<TResult, TDetails, RollRecord>` interface
   - See `packages/blades/src/roll/index.ts` for example

4. **Export from index.ts**:

   ```typescript
   export { rollGameName } from './rollGameName'
   export type { GameNameResult } from './types'
   ```

5. **Add tests** in `__tests__/` following existing patterns:
   - Use `bun:test` imports
   - Test boundary conditions
   - Use 9999 iterations for stress tests

6. **Add AGENTS.md** documenting game-specific mechanics and usage

7. **Update root AGENTS.md** to list the new package in the "Game Packages" section

### Adding a New Modifier to @randsum/roller

1. **Define type** in `packages/roller/src/types.ts`:
   - Add to `ModifierOptions` interface
   - Create specific options type if needed (e.g., `DropOptions`, `RerollOptions`)

2. **Add regex pattern** in `packages/roller/src/lib/patterns/modifierPatterns.ts`:
   - Pattern should be case-insensitive
   - Capture groups for parameters
   - See existing patterns for reference

3. **Implement handler** in `packages/roller/src/lib/modifiers/handlers.ts`:
   - Create `handle{ModifierName}` function
   - Use `createModifierLog` for history tracking
   - Return `NumericRollBonus` with updated rolls and logs

4. **Add to switch statement** in `applyModifierHandler()`:
   - Add case for new modifier type
   - Type assertions are safe due to literal type matching

5. **Add to apply order** via the modifier's `priority` field:
   - Order: cap (10) → drop (20) → keep (21) → replace (30) → reroll (40) → explode (50) → compound (51) → penetrate (52) → unique (60) → multiply (85) → plus (90) → minus (91) → countSuccesses (95) → multiplyTotal (100)
   - Lower numbers execute first

6. **Update notation parsing** in `packages/roller/src/lib/notation/`:
   - Add pattern matching in `singleNotationToOptions.ts`
   - Update `optionsToNotation.ts` for round-trip conversion

7. **Update documentation**:
   - Add syntax to `packages/roller/RANDSUM_DICE_NOTATION.md`
   - Include examples and use cases

8. **Add tests**:
   - Test basic functionality
   - Test edge cases (boundary conditions)
   - Test modifier combinations
   - Test notation parsing and round-trip conversion

### Debugging a Failing Roll

1. **Validate notation first**:

   ```typescript
   import { validateNotation } from '@randsum/roller'
   const validation = validateNotation(notation)
   if (!validation.valid) {
     console.error('Invalid notation:', validation.error)
   }
   ```

2. **Check modifier application order**:
   - Verify modifiers are applied in correct sequence
   - Order: cap → drop → keep → replace → reroll → explode → compound → penetrate → unique → multiply → plus → minus → countSuccesses → multiplyTotal
   - Check `result.rolls[0].modifierHistory.logs` for application sequence

3. **Inspect intermediate state**:

   ```typescript
   const result = roll(notation)
   console.log('Raw rolls:', result.rolls[0].rolls)
   console.log('After modifiers:', result.rolls[0].modifierHistory.modifiedRolls)
   console.log('Modifier logs:', result.rolls[0].modifierHistory.logs)
   ```

4. **Check for modifier conflicts**:
   - Ensure drop modifiers don't remove all dice
   - Verify unique modifier has enough sides for quantity
   - Check cap ranges are valid5. **Use seeded random for reproducibility**:   ```typescript
   import { createSeededRandom } from '@randsum/roller/test-utils'
   const seeded = createSeededRandom(42)
   const result = roll(notation, { randomFn: seeded })
   ```

### Adding an MCP Tool

1. **Create tool file** in `packages/mcp/src/tools/{tool-name}.ts`:
   - Import `McpServer` type and `registerTool` helper
   - Define Zod schema for parameters
   - Implement handler function
   - Use `formatRollResult` or similar formatters for output

2. **Register tool** in `packages/mcp/src/tools/index.ts`:

   ```typescript
   export { register{ToolName}Tool } from './{tool-name}.js'
   ```

3. **Add to server** in `packages/mcp/src/server.ts`:   ```typescript
   import { register{ToolName}Tool } from './tools/index.js'
   // In createServerInstance():
   register{ToolName}Tool(server)
   ```

4. **Add tool documentation** in `packages/mcp/docs/tools/{tool-name}.md`:
   - Description of tool purpose
   - Parameter documentation
   - Example usage
   - Return value format

5. **Update server instructions** in `packages/mcp/src/server.ts`:
   - Add tool to SERVER_INSTRUCTIONS constant
   - Include in "AVAILABLE TOOLS" section6. **Test the tool**:

   - Test with valid inputs
   - Test error handling
   - Verify output format matches expected structure