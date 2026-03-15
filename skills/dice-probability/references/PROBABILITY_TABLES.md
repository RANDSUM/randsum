# Probability Tables

Pre-computed reference tables for common dice scenarios. All probabilities are exact unless noted.

## 4d6 Drop Lowest (D&D Ability Scores)

| Score | Exact P(%) | P(>=) |
|---|---|---|
| 3 | 0.08 | 100.00 |
| 4 | 0.31 | 99.92 |
| 5 | 0.77 | 99.61 |
| 6 | 1.62 | 98.84 |
| 7 | 2.93 | 97.22 |
| 8 | 4.78 | 94.29 |
| 9 | 7.02 | 89.51 |
| 10 | 9.41 | 82.49 |
| 11 | 11.42 | 73.07 |
| 12 | 12.89 | 61.65 |
| 13 | 13.27 | 48.77 |
| 14 | 12.35 | 35.49 |
| 15 | 10.11 | 23.15 |
| 16 | 7.25 | 13.04 |
| 17 | 4.17 | 5.79 |
| 18 | 1.62 | 1.62 |

**Summary:** E = 12.24, Mode = 13, Median = 12, Std Dev = 2.85

## Advantage and Disadvantage (2d20)

P(>=X) for advantage (2d20, keep highest) and disadvantage (2d20, keep lowest):

| Target | Normal | Advantage | Disadvantage |
|---|---|---|---|
| 1 | 100.0% | 100.0% | 100.0% |
| 2 | 95.0% | 99.75% | 90.25% |
| 3 | 90.0% | 99.0% | 81.0% |
| 4 | 85.0% | 97.75% | 72.25% |
| 5 | 80.0% | 96.0% | 64.0% |
| 6 | 75.0% | 93.75% | 56.25% |
| 7 | 70.0% | 91.0% | 49.0% |
| 8 | 65.0% | 87.75% | 42.25% |
| 9 | 60.0% | 84.0% | 36.0% |
| 10 | 55.0% | 79.75% | 30.25% |
| 11 | 50.0% | 75.0% | 25.0% |
| 12 | 45.0% | 69.75% | 20.25% |
| 13 | 40.0% | 64.0% | 16.0% |
| 14 | 35.0% | 57.75% | 12.25% |
| 15 | 30.0% | 51.0% | 9.0% |
| 16 | 25.0% | 43.75% | 6.25% |
| 17 | 20.0% | 36.0% | 4.0% |
| 18 | 15.0% | 27.75% | 2.25% |
| 19 | 10.0% | 19.0% | 1.0% |
| 20 | 5.0% | 9.75% | 0.25% |

**Key insight:** Advantage is worth roughly +3.3 on average but the benefit is non-linear. It is most impactful when the base chance is near 50% (targets around 11) and least impactful at extremes.

## Blades in the Dark (Nd6, Keep Highest)

Outcome tiers: Critical (two+ 6s), Success (highest=6), Partial (highest=4-5), Failure (highest=1-3).

| Pool Size | P(Crit) | P(Success) | P(Partial) | P(Failure) | E(highest) |
|---|---|---|---|---|---|
| 0 (roll 2, keep lowest) | 0.0% | 2.8% | 25.0% | 72.2% | 2.53 |
| 1 | 0.0% | 16.7% | 33.3% | 50.0% | 3.50 |
| 2 | 2.8% | 25.0% | 44.4% | 27.8% | 4.47 |
| 3 | 7.4% | 29.6% | 44.4% | 18.5% | 4.96 |
| 4 | 13.2% | 31.6% | 39.9% | 15.3% | 5.24 |
| 5 | 19.6% | 31.3% | 35.7% | 13.4% | 5.43 |
| 6 | 26.3% | 29.8% | 31.8% | 12.1% | 5.56 |

**Zero dice rule:** In Blades, rolling zero dice means rolling 2d6 and keeping the lowest result.

## PbtA / Root RPG (2d6 + stat)

Outcome tiers: Strong hit (10+), Weak hit (7-9), Miss (6-).

| Stat Mod | P(10+) | P(7-9) | P(6-) | E(total) |
|---|---|---|---|---|
| -2 | 3/36 (8.3%) | 6/36 (16.7%) | 27/36 (75.0%) | 5.0 |
| -1 | 6/36 (16.7%) | 9/36 (25.0%) | 21/36 (58.3%) | 6.0 |
| +0 | 6/36 (16.7%) | 15/36 (41.7%) | 15/36 (41.7%) | 7.0 |
| +1 | 10/36 (27.8%) | 16/36 (44.4%) | 10/36 (27.8%) | 8.0 |
| +2 | 15/36 (41.7%) | 15/36 (41.7%) | 6/36 (16.7%) | 9.0 |
| +3 | 21/36 (58.3%) | 12/36 (33.3%) | 3/36 (8.3%) | 10.0 |
| +4 | 26/36 (72.2%) | 9/36 (25.0%) | 1/36 (2.8%) | 11.0 |

**Note:** Most PbtA games cap stats at +3. The +4 row is included for reference with temporary bonuses.

## NdS Expected Values and Standard Deviations

E = N * (S+1) / 2. SD = sqrt(N * (S^2 - 1) / 12).

| Roll | Min | Max | Expected | Std Dev |
|---|---|---|---|---|
| 1d4 | 1 | 4 | 2.50 | 1.12 |
| 1d6 | 1 | 6 | 3.50 | 1.71 |
| 1d8 | 1 | 8 | 4.50 | 2.29 |
| 1d10 | 1 | 10 | 5.50 | 2.87 |
| 1d12 | 1 | 12 | 6.50 | 3.45 |
| 1d20 | 1 | 20 | 10.50 | 5.77 |
| 1d100 | 1 | 100 | 50.50 | 28.87 |
| 2d4 | 2 | 8 | 5.00 | 1.58 |
| 2d6 | 2 | 12 | 7.00 | 2.42 |
| 2d8 | 2 | 16 | 9.00 | 3.24 |
| 2d10 | 2 | 20 | 11.00 | 4.06 |
| 2d12 | 2 | 24 | 13.00 | 4.88 |
| 3d6 | 3 | 18 | 10.50 | 2.96 |
| 3d8 | 3 | 24 | 13.50 | 3.97 |
| 4d4 | 4 | 16 | 10.00 | 2.24 |
| 4d6 | 4 | 24 | 14.00 | 3.42 |
| 4d10 | 4 | 40 | 22.00 | 5.74 |
| 6d6 | 6 | 36 | 21.00 | 4.18 |
| 6d8 | 6 | 48 | 27.00 | 5.61 |
| 8d6 | 8 | 48 | 28.00 | 4.83 |
| 10d6 | 10 | 60 | 35.00 | 5.40 |
| 10d10 | 10 | 100 | 55.00 | 9.08 |

## D&D 5e: P(Hit) by AC and Attack Modifier

P(hit) = (21 + mod - AC) / 20, clamped to [5%, 95%]. Natural 1 always misses, natural 20 always hits.

| AC | +0 | +3 | +5 | +7 | +9 | +11 |
|---|---|---|---|---|---|---|
| 10 | 55% | 70% | 80% | 90% | 95% | 95% |
| 12 | 45% | 60% | 70% | 80% | 90% | 95% |
| 14 | 35% | 50% | 60% | 70% | 80% | 90% |
| 16 | 25% | 40% | 50% | 60% | 70% | 80% |
| 18 | 15% | 30% | 40% | 50% | 60% | 70% |
| 20 | 5% | 20% | 30% | 40% | 50% | 60% |
| 22 | 5% | 10% | 20% | 30% | 40% | 50% |
| 25 | 5% | 5% | 5% | 15% | 25% | 35% |

## Reroll Impact (1dN, reroll values <= T)

Approximate expected value when rerolling once: E = (N+1)/2 + T*(T)/(2*N).

| Roll | No Reroll | Reroll 1s | Reroll <=2 |
|---|---|---|---|
| 1d6 | 3.50 | 3.92 | 4.25 |
| 1d8 | 4.50 | 4.94 | 5.31 |
| 1d10 | 5.50 | 5.95 | 6.35 |
| 1d12 | 6.50 | 6.96 | 7.38 |
| 1d20 | 10.50 | 10.98 | 11.40 |

**Note:** Rerolling 1s on a d6 gains +0.42 expected value. Modest but meaningful over many rolls.

## Exploding Dice Impact (1dN!)

When a die explodes on its max value (one explosion):

| Die | Normal E | Exploding E | P(explode) |
|---|---|---|---|
| 1d4 | 2.50 | 3.13 | 25.0% |
| 1d6 | 3.50 | 4.08 | 16.7% |
| 1d8 | 4.50 | 5.06 | 12.5% |
| 1d10 | 5.50 | 6.05 | 10.0% |
| 1d12 | 6.50 | 7.04 | 8.3% |
| 1d20 | 10.50 | 11.03 | 5.0% |

**Note:** Exploding adds roughly (S+1)/(2*S) to the expected value per explosion. Smaller dice benefit proportionally more from explosion.
