---
type: "agent_requested"
description: "Game package extension patterns"
---

# Game Package Patterns

## Package Structure

- Use `@randsum/game-name` naming convention
- Export primary roll function and game-specific types
- Always depend on `@randsum/roller` core package

## API Design

- Return tuples: `[GameResult, RollResult]` for game result + roll details
- Use core `roll()` function, then interpret results for game mechanics
- Define clear game-specific result types (e.g., `'critical' | 'success' | 'failure'`)

## Integration

```typescript
import { roll as coreRoll } from '@randsum/roller'

export function rollGame(dicePool: number): [GameResult, RollResult] {
  const rollResult = coreRoll({ sides: 6, quantity: dicePool })
  const gameResult = interpretResult(rollResult)
  return [gameResult, rollResult]
}
```

