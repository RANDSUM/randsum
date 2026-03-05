---
name: dice-rolling
description: Roll dice using RANDSUM notation for tabletop RPGs. Use when users ask to roll dice, need probability calculations, or want game-specific mechanics for D&D, Blades in the Dark, PbtA, Daggerheart, Root RPG, and Salvage Union.
license: MIT
metadata:
  author: RANDSUM
  version: "2.2"
  repository: https://github.com/RANDSUM/randsum
---

# Dice Rolling Skill

## When to Use This Skill

Activate this skill when users:

- Ask to roll dice (e.g., "roll 2d6", "roll for damage")
- Need D&D 5E mechanics (advantage, disadvantage, ability scores, critical hits)
- Want game-specific rolls (Blades in the Dark, Daggerheart, PbtA, Root RPG, Salvage Union)
- Need probability simulations or random number generation
- Ask about dice notation syntax or modifiers

## Installation

Copy the `dice-rolling/` skill folder into your agent's skills directory:

| Agent | Project scope | Global scope |
| ----- | ------------- | ------------ |
| **Claude Code** | `.claude/skills/dice-rolling/` | `~/.claude/skills/dice-rolling/` |
| **Cursor** | `.cursor/skills/dice-rolling/` | `~/.cursor/skills/dice-rolling/` |
| **Other agents** | `.<agent>/skills/dice-rolling/` | `~/.<agent>/skills/dice-rolling/` |

Most skills-compatible agents discover skills automatically once placed in the correct directory. Restart your agent or reload the session after installing.

> If your agent supports plugins or a marketplace, search for **RANDSUM** to install this skill without manually copying files.

## Notation Overview

All notation is case-insensitive. Basic syntax is `NdS` (N dice, S sides).

### Drop & Keep

| Notation  | Description               |
| --------- | ------------------------- |
| `4d6L`    | Drop lowest die           |
| `4d6L2`   | Drop 2 lowest dice        |
| `4d6H`    | Drop highest die          |
| `4d6H2`   | Drop 2 highest dice       |
| `4d6K3`   | Keep highest 3 (= `4d6L`) |
| `4d6kl2`  | Keep lowest 2             |
| `4d20D{>17}` | Drop dice over 17      |
| `4d20D{<5}`  | Drop dice under 5      |
| `4d20D{8,12}` | Drop exact values 8 and 12 |

### Arithmetic

| Notation   | Description                              |
| ---------- | ---------------------------------------- |
| `1d20+5`   | Add 5 to total                           |
| `4d6-1`    | Subtract 1 from total                    |
| `2d6*2`    | Multiply dice sum (before +/-)           |
| `2d6+3**2` | Multiply entire final total (after +/-)  |

Order: `(dice × *) ± +/- then × **`

### Reroll, Replace, Cap, Unique

| Notation       | Description                        |
| -------------- | ---------------------------------- |
| `4d6R{1}`      | Reroll 1s                          |
| `4d20R{<5}`    | Reroll results under 5             |
| `4d20R{>17}`   | Reroll results over 17             |
| `4d20R{8,12}`  | Reroll exact values 8 and 12       |
| `4d20R{<5}3`   | Reroll under 5, max 3 attempts     |
| `4d20V{8=12}`  | Replace 8s with 12s                |
| `4d20V{>17=20}` | Replace values over 17 with 20   |
| `4d20C{>18}`   | Cap rolls over 18 down to 18       |
| `4d20C{<3}`    | Cap rolls under 3 up to 3          |
| `4d20C{<2,>19}` | Floor 2, ceiling 19              |
| `4d20U`        | All results must be unique         |
| `4d20U{5,10}`  | Unique, but 5s and 10s may repeat  |

### Exploding Dice

| Notation  | Description                                             |
| --------- | ------------------------------------------------------- |
| `3d6!`    | Explode: extra die on max, adds new dice to pool        |
| `3d6!5`   | Explode up to 5 times per die                           |
| `3d6!0`   | Explode unlimited (capped at 100)                       |
| `3d6!!`   | Compound: extra roll adds to same die's value           |
| `3d6!!5`  | Compound up to 5 times per die                          |
| `3d6!p`   | Penetrate: explode but subtract 1 from each extra roll  |
| `3d6!p5`  | Penetrate up to 5 times per die                         |

**Explode vs Compound vs Penetrate:**
- `!` — `[6,4,6]` → `[6,4,6,5,3]` = 24 (adds new dice)
- `!!` — `[6,4,6]` → `[15,4,12]` = 31 (modifies existing dice)
- `!p` — like `!!` but each extra roll is reduced by 1

### Count Successes (Dice Pools)

| Notation       | Description                               |
| -------------- | ----------------------------------------- |
| `5d10S{7}`     | Count dice ≥ 7                            |
| `5d10S{7,1}`   | Count successes ≥ 7, subtract botches ≤ 1 |

Used in World of Darkness, Shadowrun, and similar pool systems.

### Multiple Dice Groups

```
1d20+2d6+5       # Attack roll (d20) + damage (2d6) + modifier
2d12-1d6         # Roll 2d12, subtract 1d6
1d20-2d6+10d8+2  # Complex multi-pool expression
```

### Modifier Application Order

| Priority | Modifier        | Notation   |
| -------- | --------------- | ---------- |
| 10       | Cap             | `C{...}`   |
| 20       | Drop            | `H`, `L`   |
| 21       | Keep            | `K`, `kl`  |
| 30       | Replace         | `V{...}`   |
| 40       | Reroll          | `R{...}`   |
| 50       | Explode         | `!`        |
| 51       | Compound        | `!!`       |
| 52       | Penetrate       | `!p`       |
| 60       | Unique          | `U`        |
| 85       | Pre-multiply    | `*N`       |
| 90/91    | Plus / Minus    | `+N` / `-N` |
| 95       | Count Successes | `S{...}`   |
| 100      | Total Multiply  | `**N`      |

For full examples and options object equivalents, see [references/NOTATION.md](references/NOTATION.md).

## Game System Support

See [references/GAME_SYSTEMS.md](references/GAME_SYSTEMS.md) for detailed mechanics.

- **D&D 5E**: Advantage `2d20L`, Disadvantage `2d20H`, Ability scores `4d6L`, Crit `2d6+3**2`
- **Blades in the Dark**: `Nd6` pool, keep highest; 6 = success, 4-5 = partial, 1-3 = failure
- **Daggerheart**: `2d12` Hope/Fear dice
- **PbtA / Root RPG**: `2d6` + stat; 10+ strong hit, 7-9 weak hit, 6- miss
- **Salvage Union**: d20 roll-under; lower is better

## CLI (`@randsum/cli`)

Pass notation as arguments for a quick roll. Running with no arguments launches the interactive TUI.

```bash
# Quick roll — pass notation as arguments
npx @randsum/cli 4d6L        # Drop lowest — D&D ability score
npx @randsum/cli 2d20H       # Disadvantage (drop highest)
npx @randsum/cli 1d20+5      # Attack roll with modifier
npx @randsum/cli 3d6!        # Exploding dice

# No arguments → interactive TUI
npx @randsum/cli
npx @randsum/cli -i          # Explicit interactive flag

# Output options
npx @randsum/cli 4d6L --verbose   # Detailed roll breakdown
npx @randsum/cli 4d6L --json      # JSON output
npx @randsum/cli 4d6L --seed 42   # Reproducible roll (seeded RNG)
```

## Programmatic (`@randsum/roller`)

```typescript
import { roll } from "@randsum/roller"

roll(20)                           // 1d20 — number = sides
roll("4d6L")                       // notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
roll("1d20", "2d6", "+5")          // multiple args — combined total

const result = roll("2d6+3")
result.total   // sum after modifiers
result.rolls   // original dice values
result.result  // values after modifiers applied
```

## Best Practices

1. **Explain rolls**: State what the notation means before showing results
2. **Show intermediate results**: Display raw rolls before modifiers
3. **Match the game system**: Use notation appropriate for the user's TTRPG
4. **Provide context**: Explain what success/failure means in the game system

## Example Interactions

### D&D Ability Score

**User**: "Roll for my D&D character's strength score"

Rolling `4d6L` (4d6, drop lowest):
- Raw rolls: [4, 3, 5, 2] → dropped 2 → **Total: 12**

### Attack with Advantage

**User**: "I attack with advantage and my +7 modifier"

Rolling `2d20L+7` (keep highest of 2d20):
- Raw rolls: [14, 8] → kept 14 → **Total: 21**

### Blades Action

**User**: "Roll a Blades action with 3 dice"

Rolling `3d6`:
- Results: [4, 6, 2] → highest is 6 → **Full Success!**

### World of Darkness Pool

**User**: "Roll 5 dice, difficulty 7"

Rolling `5d10S{7}`:
- Results: [8, 3, 10, 6, 9] → successes (≥7): 8, 10, 9 → **3 successes**

## Additional Resources

- [Complete RANDSUM Notation Reference](https://randsum.dev/packages/roller/)
- [Game-Specific Mechanics Documentation](https://randsum.dev/games/)
- [GitHub Repository](https://github.com/RANDSUM/randsum)
