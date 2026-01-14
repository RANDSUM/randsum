# RANDSUM Dice Notation Reference

Complete reference for RANDSUM dice notation syntax and modifiers.

## Basic Syntax

All notation in RANDSUM is case-insensitive (`2d8` = `2D8`).

### Standard Rolls

| Notation | Description             | Example Use Case         |
| -------- | ----------------------- | ------------------------ |
| `1d20`   | Roll one 20-sided die   | D&D attack/save rolls    |
| `2d6`    | Roll two 6-sided dice   | Damage, 2d6 systems      |
| `4d6`    | Roll four 6-sided dice  | Ability score generation |
| `1d100`  | Roll one 100-sided die  | Percentile rolls         |
| `3d8`    | Roll three 8-sided dice | Damage rolls             |

## Modifiers

### Arithmetic (+/-)

Add or subtract fixed values from the total.

```
2d6+3    → Roll 2d6, add 3 to total
1d20-2   → Roll 1d20, subtract 2 from total
4d6+10   → Roll 4d6, add 10 to total
```

### Drop Modifiers (L/H)

Remove dice from the results before summing.

```
4d6L     → Drop lowest die (D&D ability scores)
4d6L2    → Drop 2 lowest dice
4d6H     → Drop highest die
4d6H2    → Drop 2 highest dice
4d6LH    → Drop both lowest and highest
```

**Game Applications**:

- `2d20L` = D&D Advantage (keep highest)
- `2d20H` = D&D Disadvantage (keep lowest)
- `4d6L` = D&D ability score generation

### Drop by Value (D)

Drop dice matching specific conditions.

```
4d20D{>17}    → Drop all results over 17
4d20D{<5}     → Drop all results under 5
4d20D{8,12}   → Drop all 8s and 12s
```

### Reroll Modifiers (R)

Reroll dice matching certain conditions.

```
4d6R{1}       → Reroll 1s (once)
4d6R{<3}      → Reroll results under 3
4d6R{1,2}     → Reroll 1s and 2s
4d6R{<3}3     → Reroll under 3, max 3 attempts
```

### Replace Modifiers (V)

Replace specific results with new values.

```
4d20V{1=2}     → Replace 1s with 2s
4d20V{>17=20}  → Replace results over 17 with 20
4d20V{<5=5}    → Replace results under 5 with 5
```

### Cap Modifiers (C)

Limit roll values to specific ranges.

```
4d20C{>18}     → Cap results over 18 to 18
4d20C{<3}      → Cap results under 3 to 3
4d20C{<2,>19}  → Cap both extremes
```

### Unique Results (U)

Force all results to be different.

```
4d20U          → All results must be unique
4d20U{5,10}    → Unique except 5s and 10s can repeat
```

**Note**: Requesting more unique results than sides will cause issues.

### Exploding Dice (!)

Roll additional dice when maximum value is rolled.

```
3d6!     → Roll extra d6 for each 6 rolled
2d10!    → Roll extra d10 for each 10 rolled
```

Exploding dice cascade - if the extra die also rolls maximum, roll again.

## Combining Modifiers

Modifiers can be chained together in any order:

```
4d6L+2         → Drop lowest, add 2
2d20H!+1       → Drop highest, explode, add 1
4d6R{<3}L      → Reroll under 3, then drop lowest
4d6LR{1}!+3    → Reroll 1s, explode, drop lowest, add 3
```

## Multiple Dice Groups

Roll multiple dice types in a single expression:

```
1d20+2d6+3     → Roll d20, add 2d6, add 3
2d12-1d6       → Roll 2d12, subtract 1d6
1d8+1d6+5      → Roll d8, add d6, add 5
```

## Comparison Operators

Used in conditions for R, D, C, and V modifiers:

| Operator | Meaning          | Example      |
| -------- | ---------------- | ------------ |
| `>`      | Greater than     | `R{>5}`      |
| `<`      | Less than        | `R{<3}`      |
| `=`      | Equal to (lists) | `R{1,2,3}`   |
| `,`      | Multiple values  | `D{8,12,15}` |

## Quick Reference Table

| Modifier | Syntax           | Effect                     |
| -------- | ---------------- | -------------------------- |
| `+`      | `NdS+X`          | Add X to total             |
| `-`      | `NdS-X`          | Subtract X from total      |
| `L`      | `NdSL` / `NdSLN` | Drop N lowest (default 1)  |
| `H`      | `NdSH` / `NdSHN` | Drop N highest (default 1) |
| `D{}`    | `NdSD{cond}`     | Drop matching condition    |
| `R{}`    | `NdSR{cond}`     | Reroll matching condition  |
| `V{}`    | `NdSV{from=to}`  | Replace values             |
| `C{}`    | `NdSC{cond}`     | Cap values                 |
| `U`      | `NdSU`           | Unique results only        |
| `!`      | `NdS!`           | Exploding dice             |

## Common Patterns

### D&D 5E

```
1d20+5         → Standard attack/check
2d20L+5        → Advantage
2d20H+5        → Disadvantage
4d6L           → Ability score (4d6 drop lowest)
2d6+3          → Weapon damage
8d6            → Fireball damage
```

### General Gaming

```
3d6            → GURPS-style roll
2d6+stat       → PbtA-style move
1d100          → Percentile roll
1d20           → D20 system check
```
