# Game Package Patterns

## Game Package Structure

All game packages follow this pattern:

```
packages/{game-name}/
  src/
    index.ts              # Main exports
    types.ts              # Game-specific types
    roll{GameName}/       # Roll implementation
      index.ts
      interpretResult.ts  # Optional: result interpretation
  __tests__/
    roll{GameName}.test.ts
  AGENTS.md               # Package-specific agent docs
  package.json
  tsconfig.json
```

## Creating a New Game Package

1. **Copy template**: Use `packages/salvageunion/` as the simplest template
2. **Update package.json**:
   - Change `name` to `@randsum/{game-name}`
   - Update `description`
   - Ensure `@randsum/roller` is in dependencies with `workspace:~`
3. **Implement roll function**:
   - Import `roll` from `@randsum/roller`
   - Create wrapper that interprets results for the game system
   - Return `GameRollResult<TResult, TDetails, RollRecord>`
4. **Export from index.ts**:
   ```typescript
   export { rollGameName } from "./rollGameName"
   export type { GameNameResult } from "./types"
   ```
5. **Add tests** in `__tests__/` following existing patterns
6. **Add AGENTS.md** documenting game-specific mechanics
7. **Update root AGENTS.md** to list the new package

## GameRollResult Interface

All game packages should return results implementing:

```typescript
interface GameRollResult<TResult, TDetails = undefined, TRollRecord = RollRecord> {
  rolls: TRollRecord[] // Individual roll records
  total: number // Combined total
  result: TResult // Game-specific outcome (e.g., 'hit', 'miss', 'critical')
  details?: TDetails // Optional additional context
}
```

## Example Game Packages

- **blades**: Blades in the Dark - d6 dice pools, keep highest
- **daggerheart**: Daggerheart RPG - Hope/Fear d12 system
- **fifth**: D&D 5th Edition - advantage/disadvantage mechanics
- **root-rpg**: Root RPG - 2d6 + stat system
- **salvageunion**: Salvage Union - d20 roll-under system

## Common Patterns

### Simple Wrapper (like salvageunion)

Core `roll()` accepts notation string, number (e.g. `roll(20)` for 1d20), options object, or multiple arguments. Example uses notation:

```typescript
export function rollGameName(notation: DiceNotation): GameRollResult {
  const result = roll(notation)
  return {
    rolls: result.rolls,
    total: result.total,
    result: interpretResult(result.total)
  }
}
```

### With Modifiers (like fifth)

```typescript
export function rollGameName(notation: DiceNotation, advantage?: boolean): GameRollResult {
  const modifiedNotation = advantage ? applyAdvantage(notation) : notation
  const result = roll(modifiedNotation)
  return {
    rolls: result.rolls,
    total: result.total,
    result: interpretResult(result.total)
  }
}
```

## Dependencies

All game packages depend on `@randsum/roller`:

```json
{
  "dependencies": {
    "@randsum/roller": "workspace:~"
  }
}
```

Never depend on other game packages - they're all independent consumers of the core roller.
