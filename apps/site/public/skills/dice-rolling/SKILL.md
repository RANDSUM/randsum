---
name: dice-rolling
description: Roll dice using RANDSUM notation for tabletop RPGs. Use when users ask to roll dice, need probability calculations, or want game-specific mechanics for D&D, Blades in the Dark, PbtA, Daggerheart, Root RPG, and Salvage Union.
license: MIT
compatibility: Requires @randsum/mcp MCP server or @randsum/roller npm package
metadata:
  author: RANDSUM
  version: "2.0"
  repository: https://github.com/RANDSUM/randsum
---

# Dice Rolling Skill

## When to Use This Skill

Activate this skill when users:

- Ask to roll dice (e.g., "roll 2d6", "roll for damage")
- Need D&D 5E mechanics (advantage, disadvantage, ability scores)
- Want game-specific rolls (Blades in the Dark, Daggerheart, PbtA, Root RPG, Salvage Union)
- Need probability simulations or random number generation
- Ask about dice notation syntax

## Quick Notation Reference

RANDSUM uses an extended dice notation system. All notation is case-insensitive.

**Basic Syntax**: `NdS` where N = quantity, S = sides

| Notation     | Description              | Example                      |
| ------------ | ------------------------ | ---------------------------- |
| `2d6`        | Roll 2 six-sided dice    | Standard damage roll         |
| `1d20+5`     | Roll d20, add 5          | Attack roll with modifier    |
| `4d6L`       | Roll 4d6, drop lowest    | D&D ability score generation |
| `2d20L`      | Roll 2d20, drop lowest   | Advantage (keep highest)     |
| `2d20H`      | Roll 2d20, drop highest  | Disadvantage (keep lowest)   |
| `3d6!`       | Exploding dice           | Reroll and add on max result |
| `4d6R{1}`    | Reroll 1s                | Avoid minimum results        |
| `4d20U`      | Unique results only      | No duplicate values          |
| `4d20C{>18}` | Cap values over 18 to 18 | Limit maximum results        |

**Multiple dice groups**: `1d20+2d6+3` (attack plus damage), `2d12-1d6`

For complete notation documentation, see [references/NOTATION.md](references/NOTATION.md).

## Game System Support

See [references/GAME_SYSTEMS.md](references/GAME_SYSTEMS.md) for detailed mechanics.

- **D&D 5E**: Advantage `2d20L`, Disadvantage `2d20H`, Ability scores `4d6L`
- **Blades in the Dark**: d6 pools, keep highest; 6 = success, 4-5 = partial, 1-3 = failure
- **Daggerheart**: 2d12 Hope/Fear dice
- **PbtA / Root RPG**: 2d6 + stat; 10+ strong hit, 7-9 weak hit, 6- miss
- **Salvage Union**: d20 roll-under; lower is better

## Implementation Options

### Option 1: MCP Server (Recommended for AI Agents)

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

Available MCP tools: `roll`, `validate-notation`, `try-roll`, `analyze`, `game-roll`, `batch-roll`, `compare`, `count-successes`, `preset`.

### Option 2: CLI

```bash
npx @randsum/roller "4d6L"
```

### Option 3: Programmatic (TypeScript/JavaScript)

`roll()` accepts a number (sides for 1 die), a notation string, an options object, or multiple arguments:

```typescript
import { roll } from "@randsum/roller"

// Number: 1 die with that many sides
roll(20) // 1d20

// Notation string
roll("2d6+3")

// Options object (same as 2d6+3)
roll({ sides: 6, quantity: 2, modifiers: { plus: 3 } })

// Multiple arguments: combined total
roll("1d20", "2d6", "+5") // attack + damage + modifier

const result = roll("2d6+3")
console.log(result.total) // Sum of dice + modifiers
console.log(result.rolls) // Original rolls
console.log(result.result) // After modifiers applied
```

## Best Practices

1. **Always explain rolls**: When rolling dice, explain what the notation means
2. **Show intermediate results**: Display raw rolls before modifiers
3. **Match the game system**: Use appropriate mechanics for the user's game
4. **Validate first**: For complex notation, validate before rolling
5. **Provide context**: Explain what success/failure means in the game context

## Example Interactions

### D&D Ability Score

**User**: "Roll for my D&D character's strength score"

**Response**: Rolling `4d6L` (4d6, drop lowest) for ability score generation...

- Raw rolls: [4, 3, 5, 2]
- Dropped: 2 (lowest)
- Total: 12 (4 + 3 + 5)

### Attack with Advantage

**User**: "I attack with advantage and my +7 modifier"

**Response**: Rolling `2d20L+7` (advantage = roll 2d20, keep highest)...

- Raw rolls: [14, 8]
- Kept: 14 (dropped 8)
- Total: 21 (14 + 7)

### Blades Action

**User**: "Roll a Blades action with 3 dice"

**Response**: Rolling `3d6` for Blades in the Dark action...

- Results: [4, 6, 2]
- Highest: 6 = Full Success!

## Additional Resources

- [Complete RANDSUM Notation Reference](https://randsum.dev/packages/roller/)
- [Game-Specific Mechanics Documentation](https://randsum.dev/games/)
- [MCP Server Documentation](https://randsum.dev/tools/mcp/)
- [GitHub Repository](https://github.com/RANDSUM/randsum)
