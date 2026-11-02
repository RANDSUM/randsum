# `@randsum/games` API

Each game is a subpath of `@randsum/games`, generated from a `.randsum.json` spec. Every `roll()` validates its input (a value out of range throws a `RandsumError`) and returns:

```typescript
{ total: number, result: TResult, rolls: readonly RollRecord[], details?: TDetails }
```

`details` exists only on games that list it below. Each subpath also exports its result type, `inputs` (the input declarations as data, handy for building a form), `SchemaError`, and the `GameRollResult` and `RollRecord` types. `AVAILABLE_GAMES` and the `GameShortcode` type come from the `@randsum/games` root.

## Contents

- [`@randsum/games/fifth`](#randsumgamesfifth)
- [`@randsum/games/blades`](#randsumgamesblades)
- [`@randsum/games/daggerheart`](#randsumgamesdaggerheart)
- [`@randsum/games/fate`](#randsumgamesfate)
- [`@randsum/games/pbta`](#randsumgamespbta)
- [`@randsum/games/root-rpg`](#randsumgamesroot-rpg)
- [`@randsum/games/salvageunion`](#randsumgamessalvageunion)

## `@randsum/games/fifth`

D&D 5th Edition: d20 + modifier, advantage keeps the higher of 2d20, disadvantage the lower.

```typescript
roll(input?: {
  modifier?: number                          // -30..30, default 0
  rollingWith?: 'Advantage' | 'Disadvantage'
  crit?: boolean                             // report natural 1 / natural 20
})
// result: number (same as total)
// details.criticals: { isNatural1, isNatural20 } | undefined (set when crit is true)
```

Ability scores are not a game call: use `roll('4d6L')` from `@randsum/roller`.

## `@randsum/games/blades`

Blades in the Dark: a pool of d6s, read the highest.

```typescript
roll(rating?: number)            // 0..10, default 1
roll(input?: { rating?: number })
// result: 'critical' | 'success' | 'partial' | 'failure'
```

Two or more 6s is `critical`, a 6 `success`, 4–5 `partial`, 1–3 `failure`. Rating 0 rolls 2d6 and keeps the lowest (never critical).

## `@randsum/games/daggerheart`

Hope d12 and Fear d12, summed with the modifier.

```typescript
roll(input?: {
  modifier?: number                          // -30..30, default 0
  amplifyHope?: boolean                      // Hope die becomes d20
  amplifyFear?: boolean                      // Fear die becomes d20
  rollingWith?: 'Advantage' | 'Disadvantage' // adds or subtracts a d6
})
// result: 'hope' | 'fear' | 'critical_hope'   (critical_hope = the dice tie)
// details: {
//   hope: { roll, amplified }, fear: { roll, amplified }, modifier,
//   extraDie: { advantageRoll, disadvantageRoll } | undefined
// }
```

## `@randsum/games/fate`

Fate Core: 4dF plus a skill rating, read on the ladder.

```typescript
roll(modifier?: number)            // -2..5, default 0
roll(input?: { modifier?: number })
// result: 'terrible' | 'poor' | 'mediocre' | 'average' | 'fair' | 'good'
//       | 'great' | 'superb' | 'fantastic' | 'epic' | 'legendary'
```

## `@randsum/games/pbta`

Powered by the Apocalypse: 2d6 + stat.

```typescript
roll(input: {
  stat: number                               // -3..5, required
  forward?: number                           // -5..5, default 0
  ongoing?: number                           // -5..5, default 0
  rollingWith?: 'Advantage' | 'Disadvantage' // 3d6 keep highest / lowest 2
})
// result: 'strong_hit' (10+) | 'weak_hit' (7-9) | 'miss' (6-)
// details: { stat, forward, ongoing, diceTotal }
```

## `@randsum/games/root-rpg`

Root RPG: 2d6 + bonus, PbtA outcomes.

```typescript
roll(input: {
  bonus: number                              // -3..5, required
  rollingWith?: 'Advantage' | 'Disadvantage'
})
// result: 'strong_hit' | 'weak_hit' | 'miss'
```

## `@randsum/games/salvageunion`

Salvage Union: a d20 looked up on a named roll table. The tables are bundled, so this works offline.

```typescript
roll(tableName: string)            // required, e.g. 'Core Mechanic', 'Morale'
roll(input: { tableName: string })
// result: { key, label, description, tableName, table, roll }
```

`VALID_TABLE_NAMES` lists every table; an unknown name throws a `SchemaError` with code `NO_TABLE_MATCH`. On `Core Mechanic`, 20 is Nailed it, 11–19 Success, 6–10 Tough Choice, 2–5 Failure and 1 Cascade Failure.
