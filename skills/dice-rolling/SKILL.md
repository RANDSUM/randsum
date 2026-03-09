---
name: dice-rolling
description: Roll dice and interpret results for tabletop RPGs using RANDSUM notation. Use this skill whenever a user asks to roll dice, wants a random result, needs a game mechanic simulated, or mentions TTRPGs — even casually (e.g. "roll for me", "give me a strength score", "what do I get?"). Also use for questions about dice notation, probability, D&D 5E, Blades in the Dark, Daggerheart, PbtA, Root RPG, or Salvage Union mechanics.
license: MIT
metadata:
  author: RANDSUM
  version: "3.0"
  repository: https://github.com/RANDSUM/randsum
---

# Dice Rolling Skill

## Executing Rolls

When a user asks you to roll dice, **produce an actual result** — don't just show notation or code. If you have shell access, use the CLI:

```bash
bunx @randsum/cli <notation>       # in bun projects (preferred)
npx @randsum/cli <notation>        # anywhere else
```

Examples:
```bash
bunx @randsum/cli 4d6L             # D&D ability score
bunx @randsum/cli 2d20L+7          # advantage attack
bunx @randsum/cli 3d6              # Blades in the Dark pool
bunx @randsum/cli 5d10S{7}         # World of Darkness successes
```

If you don't have shell access, **simulate the roll yourself** — mentally generate random numbers as you would genuinely roll dice, and present them clearly. Don't just describe how the roll would work without giving a result.

## Response Format

After rolling, always show:
1. **What you rolled** — the notation and what it represents
2. **The dice** — raw values (and which were dropped/kept if relevant)
3. **The total** — the final number
4. **The meaning** — what it means in the game context (hit/miss, success tier, stat value, etc.)

```
Rolling 4d6L (4 six-sided dice, drop lowest) for Strength:
Dice: [5, 3, 4, 2] → dropped 2 → kept [5, 3, 4]
Total: 12
→ Strength score: 12 (modifier: +1)
```

Keep it compact — one block, no lengthy preamble. For game-system rolls, add one sentence of flavor or consequence after the result (e.g. "You pull it off cleanly." or "Brace for a complication.").

## Notation Quick Reference

All notation is case-insensitive. Basic syntax: `NdS` (N dice, S sides).

### Core Modifiers

| Notation | Description |
|---|---|
| `4d6L` | Drop lowest die |
| `4d6H` | Drop highest die |
| `4d6L2` | Drop 2 lowest |
| `4d6K3` | Keep highest 3 |
| `4d6kl2` | Keep lowest 2 |
| `1d20+5` | Add 5 to total |
| `4d6-1` | Subtract 1 |
| `2d6*2` | Multiply dice sum (before +/-) |
| `2d6+3**2` | Multiply final total (after +/-) |

### Conditional Modifiers

Conditions use comparison operators: `>N` (greater than), `<N` (less than), `>=N` (at or over), `<=N` (at or under), `=N` or bare `N` (exact match).

| Notation | Description |
|---|---|
| `4d6R{1}` | Reroll 1s (bare number = exact match) |
| `4d6R{=1}` | Same — explicit `=` form |
| `4d20R{<5}` | Reroll under 5 |
| `4d20R{<=5}` | Reroll 5 or under |
| `4d20R{>=17}` | Reroll 17 or over |
| `4d20R{<5}3` | Reroll under 5, max 3 attempts |
| `4d20V{8=12}` | Replace 8s with 12s |
| `4d20V{>17=20}` | Replace results over 17 with 20 |
| `4d20V{>=17=20}` | Replace results at or over 17 with 20 |
| `4d20V{<=3=1}` | Replace results at or under 3 with 1 |
| `4d20C{>18}` | Cap rolls over 18 down to 18 |
| `4d20C{5}` | Cap rolls above 5 to 5 (bare number = max cap) |
| `4d20C{=5}` | Same — explicit `=` form |
| `4d20C{>=5}` | Cap rolls at or over 5 to 5 |
| `4d20C{<2,>19}` | Floor 2, ceiling 19 |
| `4d20U` | All results must be unique |
| `4d20D{>17}` | Drop dice over 17 |
| `4d20D{>=17}` | Drop dice at or over 17 |
| `4d20D{1,2}` | Drop 1s and 2s |
| `4d20D{=1,=2}` | Same — explicit `=` form |

**Ultra-complex example** — roll 8d10, cap to [3,8] range, keep top 5, reroll floor values, add 4:
```
8d10C{>8,<3}K5R{=3}+4
```

### Exploding Dice

| Notation | Description |
|---|---|
| `3d6!` | Explode: new die on max result |
| `3d6!!` | Compound: add to same die on max |
| `3d6!p` | Penetrate: explode minus 1 each time |
| `3d6!5` | Explode up to 5 times per die |

### Dice Pools

| Notation | Description |
|---|---|
| `5d10S{7}` | Count dice ≥ 7 (successes) |
| `5d10S{7,1}` | Successes ≥ 7, subtract botches ≤ 1 |

### Multiple Groups

```
1d20+2d6+5        # attack (d20) + damage (2d6) + mod
2d12-1d6          # roll 2d12, subtract 1d6
```

**Modifier order** (lower = earlier): Cap (10) → Drop/Keep (20/21) → Replace (30) → Reroll (40) → Explode (50-52) → Unique (60) → Multiply (85) → Plus/Minus (90/91) → Count Successes (95) → Total Multiply (100)

Full notation reference: [references/NOTATION.md](references/NOTATION.md)

## Game Systems

See [references/GAME_SYSTEMS.md](references/GAME_SYSTEMS.md) for full mechanics.

| Game | Roll | Interpretation |
|---|---|---|
| **D&D 5E** advantage | `2d20L+mod` | Keep highest + modifier |
| **D&D 5E** disadvantage | `2d20H+mod` | Keep lowest + modifier |
| **D&D 5E** ability score | `4d6L` | Drop lowest of 4d6 |
| **D&D 5E** crit | `2×damage dice + mod` | Double the dice |
| **Blades in the Dark** | `Nd6`, keep highest | 6 = success, 4–5 = partial, 1–3 = failure; two 6s = critical |
| **Daggerheart** | `2d12` (Hope/Fear) | Higher die = narrative control; sum = mechanical success |
| **PbtA / Root RPG** | `2d6+stat` | 10+ = strong hit, 7–9 = weak hit, 6– = miss |
| **Salvage Union** | `d20` vs target | Roll under; 1 = critical success, 20 = critical failure |

## Programmatic API

```typescript
import { roll } from "@randsum/roller"

roll(20)                    // 1d20
roll("4d6L")                // notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
roll("1d20", "2d6", "+5")  // multiple args, combined total

const result = roll("2d6+3")
result.total   // final sum
result.rolls   // RollRecord[] — full roll data per dice group
result.result  // string[] — rolled values as strings
```
