---
name: dice-probability
description: Analyze probability distributions for RANDSUM dice notation. Use when users ask about odds, expected values, probability of specific outcomes, or want to compare different roll strategies. Handles standard dice, drop/keep, advantage/disadvantage, rerolls, exploding dice, and game-system outcomes.
license: MIT
metadata:
  author: RANDSUM
  version: "1.0"
  repository: https://github.com/RANDSUM/randsum
---

# Dice Probability Skill

## When to Use

Activate this skill when a user asks about:
- "What are the odds of...", "how likely is...", "what's the probability..."
- "Which is better...", "should I take advantage or +2..."
- "Expected value of...", "average roll for..."
- Comparing dice strategies or builds
- Optimizing roll choices for a game system

## Analysis Approach

### Small Spaces (exact math)

For rolls with manageable outcome spaces (up to ~6 dice, up to 20 sides, no complex modifiers), enumerate all outcomes exactly.

**Uniform (`1dN`):** Every face is equally likely. P(X) = 1/N. Expected value = (N+1)/2.

**Sum of NdS:** Total outcomes = S^N. Enumerate or use convolution. Approximately normal for large N. Expected value = N * (S+1) / 2. Variance = N * (S^2 - 1) / 12.

### Complex Modifiers (simulation)

For rerolls, exploding dice, large pools, or combined modifiers, use Monte Carlo simulation. Run 100,000+ iterations for stable results:

```typescript
import { roll } from '@randsum/roller'

const N = 100_000
const results = Array.from({ length: N }, () => roll('4d6L').total)
const avg = results.reduce((a, b) => a + b) / N
```

For reproducible simulations, use a seeded random function:

```typescript
import { roll } from '@randsum/roller'
import { createSeededRandom } from '@randsum/test-utils'

const config = { randomFn: createSeededRandom(42) }
const results = Array.from({ length: 100_000 }, () =>
  roll('4d6L', config).total
)
```

### When to Use Which

| Scenario | Method |
|---|---|
| `1dN`, `NdS` sums | Exact math |
| Drop/keep (small pools) | Exact enumeration |
| Rerolls, exploding, caps | Monte Carlo simulation |
| Comparing two strategies | Both -- exact if possible, simulation otherwise |

## Common Distributions

### Single Die (`1dN`)

Uniform distribution. E = (N+1)/2, Var = (N^2 - 1)/12.

| Die | Expected | Std Dev |
|---|---|---|
| 1d4 | 2.5 | 1.12 |
| 1d6 | 3.5 | 1.71 |
| 1d8 | 4.5 | 2.29 |
| 1d10 | 5.5 | 2.87 |
| 1d12 | 6.5 | 3.45 |
| 1d20 | 10.5 | 5.77 |

### Sum of Multiple Dice (`NdS`)

E = N * (S+1) / 2. Distribution approaches normal as N grows.

| Roll | Expected | Std Dev |
|---|---|---|
| 2d6 | 7.0 | 2.42 |
| 3d6 | 10.5 | 2.96 |
| 4d6 | 14.0 | 3.42 |
| 2d10 | 11.0 | 4.06 |
| 2d12 | 13.0 | 4.88 |

### `4d6L` (D&D Ability Score)

Drop lowest of 4d6. Skewed high. E = 12.24, Mode = 13, Median = 12.

### Advantage / Disadvantage (`2d20L` / `2d20H`)

- Advantage (keep highest): E = 13.82, P(nat 20) = 9.75%
- Disadvantage (keep lowest): E = 7.18, P(nat 1) = 9.75%
- Straight `1d20`: E = 10.5, P(any face) = 5%

See [references/PROBABILITY_TABLES.md](references/PROBABILITY_TABLES.md) for full distribution tables.

## Modifier Impact on Distributions

| Modifier | Effect on Mean | Effect on Variance |
|---|---|---|
| Drop lowest (`L`) | Increases | Decreases |
| Drop highest (`H`) | Decreases | Decreases |
| Keep highest (`K`) | Increases | Decreases |
| Keep lowest (`kl`) | Decreases | Decreases |
| Reroll low (`R{<N}`) | Slight increase | Slight decrease |
| Explode (`!`) | Increases (extends upper tail) | Increases |
| Compound (`!!`) | Same mean shift as explode | Higher variance on individual dice |
| Cap (`C{>N}`) | Decreases (truncates top) | Decreases |
| Cap (`C{<N}`) | Increases (truncates bottom) | Decreases |

**Modifier execution order matters.** Cap applies before drop/keep (priority 10 vs 20/21), so `4d6C{>4}L` caps first, then drops -- the dropped die is from the capped pool.

## Comparison Framework

When users ask "which is better?", compare along three axes:

1. **Expected value** -- which averages higher?
2. **P(success)** -- for a given target, which succeeds more often?
3. **Consistency** -- which has lower variance / tighter spread?

Present results as: "Strategy A averages X (std dev Y) vs Strategy B averaging X' (std dev Y'). Against DC 15, A succeeds Z% of the time vs B at Z'%."

Example -- advantage vs flat +2 on 1d20:
- `2d20L` (advantage): E = 13.82. P(>=15) = 51.0%
- `1d20+2`: E = 12.5. P(>=15) = 40.0%
- Advantage is better at mid-range DCs. The +2 bonus is better at extreme DCs (very low or very high targets).

## Game System Probabilities

### D&D 5e

- **P(hit)** = (21 - AC + modifier) / 20, clamped to [0.05, 0.95] (nat 1 always misses, nat 20 always hits)
- **Advantage impact**: roughly equivalent to +3.3 to the roll on average, but non-linear -- strongest near 50% base chance
- **4d6L ability scores**: see tables in references

### Blades in the Dark (Nd6, keep highest)

| Pool | P(Critical) | P(Success) | P(Partial) | P(Failure) |
|---|---|---|---|---|
| 0 (2d6kl) | 0% | 2.8% | 25.0% | 72.2% |
| 1d6 | 0% | 16.7% | 33.3% | 50.0% |
| 2d6 | 2.8% | 25.0% | 44.4% | 27.8% |
| 3d6 | 7.4% | 29.6% | 44.4% | 18.5% |
| 4d6 | 13.2% | 31.6% | 39.9% | 15.3% |

Critical = two or more 6s. Success = highest is 6. Partial = highest is 4-5. Failure = highest is 1-3.

### PbtA / Root RPG (2d6 + stat)

| Stat | P(10+) Strong | P(7-9) Weak | P(6-) Miss |
|---|---|---|---|
| -1 | 8.3% | 33.3% | 58.3% |
| +0 | 16.7% | 41.7% | 41.7% |
| +1 | 27.8% | 44.4% | 27.8% |
| +2 | 41.7% | 41.7% | 16.7% |
| +3 | 58.3% | 33.3% | 8.3% |

### Salvage Union (1d20, roll under target)

P(success) = target / 20. Critical success on 1 (5%). Critical failure on 20 (5%).

## References

- [Full probability tables](references/PROBABILITY_TABLES.md) -- 4d6L distribution, advantage/disadvantage curves, Blades and PbtA lookup tables
- [Dice notation spec](../../packages/roller/RANDSUM_DICE_NOTATION.md) -- complete modifier syntax
- [Game system mechanics](../dice-rolling/references/GAME_SYSTEMS.md) -- how each game interprets rolls
