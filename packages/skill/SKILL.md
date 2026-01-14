---
name: randsum-dice-rolling
description: Advanced dice rolling capabilities for tabletop RPGs using RANDSUM notation. Use this skill when the user needs to roll dice, simulate probability, or interact with game mechanics for systems like D&D 5E, Blades in the Dark, Daggerheart, Root RPG, or Salvage Union.
license: MIT
metadata:
  author: Alex Jarvis
  version: "1.0.0"
  homepage: https://github.com/RANDSUM/randsum
---

# RANDSUM Dice Rolling Skill

You are an expert at dice rolling and tabletop RPG mechanics using the RANDSUM ecosystem. This skill enables you to help users with dice rolls, probability calculations, and game-specific mechanics.

## When to Use This Skill

Activate this skill when users:

- Ask to roll dice (e.g., "roll 2d6", "roll for damage")
- Need D&D 5E mechanics (advantage, disadvantage, ability scores)
- Want game-specific rolls (Blades in the Dark, Daggerheart, Root RPG, Salvage Union)
- Need probability simulations or random number generation
- Ask about dice notation syntax

## Core Capabilities

### 1. RANDSUM Dice Notation

RANDSUM uses an extended dice notation system. All notation is case-insensitive.

**Basic Syntax**: `NdS` where N = quantity, S = sides

| Notation     | Description              | Example                      |
| ------------ | ------------------------ | ---------------------------- |
| `2d6`        | Roll 2 six-sided dice    | Standard damage roll         |
| `1d20+5`     | Roll d20, add 5          | Attack roll with modifier    |
| `4d6L`       | Roll 4d6, drop lowest    | D&D ability score generation |
| `2d20H`      | Roll 2d20, drop highest  | Disadvantage (keep lowest)   |
| `2d20L`      | Roll 2d20, drop lowest   | Advantage (keep highest)     |
| `3d6!`       | Exploding dice           | Reroll and add on max result |
| `4d6R{1}`    | Reroll 1s                | Avoid minimum results        |
| `4d20U`      | Unique results only      | No duplicate values          |
| `4d20C{>18}` | Cap values over 18 to 18 | Limit maximum results        |

### 2. Modifier Reference

**Drop Modifiers (L/H)**:

- `4d6L` - Drop lowest result
- `4d6L2` - Drop 2 lowest results
- `4d6H` - Drop highest result
- `4d6H2` - Drop 2 highest results
- `4d6LH` - Drop both extremes

**Reroll Modifiers (R)**:

- `4d6R{1}` - Reroll 1s
- `4d6R{<3}` - Reroll results under 3
- `4d6R{1,2}` - Reroll 1s and 2s
- `4d6R{<3}3` - Reroll under 3, max 3 attempts

**Exploding Dice (!)**:

- `3d6!` - Roll extra die on maximum result

**Unique Results (U)**:

- `4d20U` - All results must be unique
- `4d20U{5,10}` - Unique except 5s and 10s can repeat

**Capping (C)**:

- `4d20C{>18}` - Cap maximum at 18
- `4d6C{<2}` - Cap minimum at 2
- `4d20C{<2,>19}` - Cap both extremes

**Arithmetic (+/-)**:

- `2d6+3` - Add 3 to total
- `1d20-2` - Subtract 2 from total

**Combining Modifiers**:

- `4d6LR{1}+2` - Reroll 1s, drop lowest, add 2

### 3. Multiple Dice Groups

Roll multiple dice types together:

- `1d20+2d6+3` - Attack roll plus damage
- `2d12-1d6` - Roll 2d12, subtract 1d6

## Game System Support

### D&D 5th Edition (@randsum/fifth)

Common patterns:

- **Advantage**: `2d20L` (roll 2, drop lowest = keep highest)
- **Disadvantage**: `2d20H` (roll 2, drop highest = keep lowest)
- **Ability Scores**: `4d6L` (roll 4d6, drop lowest)
- **Attack + Damage**: `1d20+5` then `2d6+3`

### Blades in the Dark (@randsum/blades)

Action rolls use d6 dice pools:

- Roll pool of d6s based on action rating
- Keep highest result for outcome
- 6 = success, 4-5 = partial, 1-3 = failure
- Multiple 6s = critical success

### Daggerheart (@randsum/daggerheart)

Uses Hope/Fear dice:

- Roll 2d12 (one Hope, one Fear)
- Higher die determines narrative outcome
- Sum determines mechanical success

### Root RPG (@randsum/root-rpg)

Uses 2d6 + stat:

- 10+ = strong hit
- 7-9 = weak hit
- 6- = miss

### Salvage Union (@randsum/salvageunion)

d20 roll-under system:

- Roll d20, compare to target number
- Lower is better
- 1 = critical success, 20 = critical failure

## Implementation Options

### Option 1: MCP Server (Recommended for AI Agents)

Install and configure the RANDSUM MCP server for direct tool access:

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

Available MCP tools:

- `roll` - Execute dice rolls with full notation support
- `validate-notation` - Validate and explain notation syntax

### Option 2: CLI

```bash
npx @randsum/roller "4d6L"
```

### Option 3: Programmatic (TypeScript/JavaScript)

```typescript
import { roll } from "@randsum/roller"

// Basic roll
const result = roll("2d6+3")
console.log(result.total) // Sum of dice + modifiers

// Access detailed results
console.log(result.rawResult) // Original rolls
console.log(result.modifiedResult) // After modifiers applied
```

## Best Practices

1. **Always explain rolls**: When rolling dice, explain what the notation means
2. **Show intermediate results**: Display raw rolls before modifiers
3. **Match the game system**: Use appropriate mechanics for the user's game
4. **Validate first**: For complex notation, validate before rolling
5. **Provide context**: Explain what success/failure means in the game context

## Example Interactions

**User**: "Roll for my D&D character's strength score"
**Response**: Rolling `4d6L` (4d6, drop lowest) for ability score generation...

- Raw rolls: [4, 3, 5, 2]
- Dropped: 2 (lowest)
- Total: 12 (4 + 3 + 5)

**User**: "I attack with advantage and my +7 modifier"
**Response**: Rolling `2d20L+7` (advantage = roll 2d20, keep highest)...

- Raw rolls: [14, 8]
- Kept: 14 (dropped 8)
- Total: 21 (14 + 7)

**User**: "Roll a Blades action with 3 dice"
**Response**: Rolling `3d6` for Blades in the Dark action...

- Results: [4, 6, 2]
- Highest: 6 = Full Success!

## Additional Resources

For complete notation reference, see `references/notation.md`.
For game-specific mechanics, see `references/game-systems.md`.
