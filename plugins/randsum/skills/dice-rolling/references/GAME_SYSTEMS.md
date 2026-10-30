# RANDSUM Game Systems

Each supported game has a shortcode. Pass it as `game` to the `roll_game` MCP tool, or put it in the HTTP path `/v1/games/<shortcode>/roll`. The inputs below are the tool's `params` and the HTTP query (or JSON body) fields. `GET https://api.randsum.dev/v1/games` lists them live.

Every game roll returns `total`, `result` (the game's outcome), `rolls` (only the dice that count) and, for some games, `details`.

## Contents

- [D&D 5th Edition (`fifth`)](#dd-5th-edition-fifth)
- [Blades in the Dark (`blades`)](#blades-in-the-dark-blades)
- [Daggerheart (`daggerheart`)](#daggerheart-daggerheart)
- [Fate Core (`fate`)](#fate-core-fate)
- [Powered by the Apocalypse (`pbta`)](#powered-by-the-apocalypse-pbta)
- [Root RPG (`root-rpg`)](#root-rpg-root-rpg)
- [Salvage Union (`salvageunion`)](#salvage-union-salvageunion)

## D&D 5th Edition (`fifth`)

1d20 + modifier. Advantage rolls 2d20 and keeps the highest; disadvantage keeps the lowest.

| Input | Type | Notes |
|---|---|---|
| `modifier` | integer, -30 to 30 | Default 0 |
| `rollingWith` | `"Advantage"` or `"Disadvantage"` | Optional |
| `crit` | boolean | When true, `details.criticals` reports `isNatural1` / `isNatural20` |

`result` is the number (d20 + modifier). Pass `crit: true` for attack rolls and saving throws where a natural 1 or 20 matters.

Plain notation equivalents: `1d20+5`, advantage `2d20L+5` (drop lowest), disadvantage `2d20H+5` (drop highest). Ability scores are `4d6L`, or `4d6Lx6` for all six. Critical damage doubles the dice, not the modifier: `2d6+3` becomes `4d6+3`.

## Blades in the Dark (`blades`)

Roll a pool of d6s and read the highest die.

| Input | Type | Notes |
|---|---|---|
| `rating` | integer, 0 to 10 | Pool size: action rating plus assists, push, and bonus dice. Default 1 |

| Highest die | `result` |
|---|---|
| Two or more 6s | `critical` |
| 6 | `success` |
| 4–5 | `partial` |
| 1–3 | `failure` |

A rating of 0 rolls 2d6 and keeps the lowest; it can never be a critical.

## Daggerheart (`daggerheart`)

Two d12s, a Hope die and a Fear die. Their sum plus the modifier is the total; whichever die is higher decides who gains narrative control.

| Input | Type | Notes |
|---|---|---|
| `modifier` | integer, -30 to 30 | Default 0 |
| `rollingWith` | `"Advantage"` or `"Disadvantage"` | Adds or subtracts a d6 |
| `amplifyHope` | boolean | Hope die becomes a d20 |
| `amplifyFear` | boolean | Fear die becomes a d20 |

`result` is `hope`, `fear`, or `critical_hope` (the two dice tie, which is a critical success). `details` holds `hope.roll`, `fear.roll`, `modifier` and `extraDie` (the advantage or disadvantage d6).

## Fate Core (`fate`)

Four Fate dice (`4dF`, each -1, 0 or +1) plus a skill rating, read on the Fate ladder.

| Input | Type | Notes |
|---|---|---|
| `modifier` | integer, -2 to 5 | Skill rating. Default 0 |

`result` is the ladder rung: `terrible` (-2 or less), `poor` (-1), `mediocre` (0), `average` (1), `fair` (2), `good` (3), `great` (4), `superb` (5), `fantastic` (6), `epic` (7), `legendary` (8+).

## Powered by the Apocalypse (`pbta`)

2d6 + stat, the generic engine behind Apocalypse World, Dungeon World, Monster of the Week, Masks and others.

| Input | Type | Notes |
|---|---|---|
| `stat` | integer, -3 to 5 | **Required** |
| `forward` | integer, -5 to 5 | One-time bonus. Default 0 |
| `ongoing` | integer, -5 to 5 | Persistent bonus. Default 0 |
| `rollingWith` | `"Advantage"` or `"Disadvantage"` | Roll 3d6, keep the highest or lowest 2 |

`result` is `strong_hit` (10+), `weak_hit` (7–9) or `miss` (6 or less). `details` holds the inputs and `diceTotal`.

## Root RPG (`root-rpg`)

2d6 + bonus with PbtA outcomes.

| Input | Type | Notes |
|---|---|---|
| `bonus` | integer, -3 to 5 | **Required** |
| `rollingWith` | `"Advantage"` or `"Disadvantage"` | Roll 3d6, keep the highest or lowest 2 |

`result` is `strong_hit` (10+), `weak_hit` (7–9) or `miss` (6 or less).

## Salvage Union (`salvageunion`)

A d20 looked up on one of the game's roll tables. Higher is better on the Core Mechanic table.

| Input | Type | Notes |
|---|---|---|
| `tableName` | string | **Required**, exact table name |

Common tables: `Core Mechanic`, `Group Initiative`, `Critical Injury`, `Critical Damage`, `Reactor Overload`, `Area Salvage`, `Mech Salvage`, `Reaction Roll`, `NPC Action`, `Morale`, `Retreat`. There are many more (crawler, chimerium, character-creation tables); an unknown name returns an error.

Core Mechanic: 20 Nailed It, 11–19 Success, 6–10 Tough Choice, 2–5 Failure, 1 Cascade Failure.

`result` holds `label`, `description` (the table text to read out), `tableName` and `roll`.

## Games without a shortcode

Any other system can still be rolled with plain notation and interpreted by hand, for example Shadowrun-style pools `12d6S{5}`, World of Darkness `8d10S{8,1}`, Savage Worlds trait dice `1d8!`, or a D6 System wild die `5d6W`.
