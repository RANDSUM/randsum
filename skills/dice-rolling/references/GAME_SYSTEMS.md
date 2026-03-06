# RANDSUM Game Systems

## Supported Game Packages

### @randsum/blades - Blades in the Dark

- **Mechanics**: d6 dice pools, keep highest result
- **Outcomes**: 6 = success, 4-5 = partial, 1-3 = failure; multiple 6s = critical
- **0 dice pool**: rolls 2d6, drops highest (desperate position)
- **Result type**: `'critical' | 'success' | 'partial' | 'failure'`
- **Usage**: `roll(poolSize: number)`

```typescript
const result = roll(3)
result.result // 'critical' | 'success' | 'partial' | 'failure'
result.total  // sum of dice
```

### @randsum/daggerheart - Daggerheart RPG

- **Mechanics**: Hope/Fear d12 system
- **Roll**: 2d12 (one Hope die, one Fear die) + optional advantage/disadvantage d6
- **Outcome**: Higher die determines narrative (Hope/Fear/Critical Hope); sum determines mechanical success
- **Result type**: `'hope' | 'fear' | 'critical hope'`
- **Usage**: `roll(arg?: DaggerheartRollArgument)`

```typescript
interface DaggerheartRollArgument {
  modifier?: number                               // added to total
  rollingWith?: 'Advantage' | 'Disadvantage'      // adds/subtracts a d6
  amplifyHope?: boolean                           // use d20 instead of d12 for Hope
  amplifyFear?: boolean                           // use d20 instead of d12 for Fear
}

const result = roll({ modifier: 3, rollingWith: 'Advantage' })
result.result.type    // 'hope' | 'fear' | 'critical hope'
result.result.details // { hope, fear, advantage, modifier }
```

### @randsum/fifth - D&D 5th Edition

- **Mechanics**: d20 with advantage/disadvantage
- **Advantage**: Roll 2d20, keep highest (`2d20L` — drop lowest)
- **Disadvantage**: Roll 2d20, keep lowest (`2d20H` — drop highest)
- **Ability Scores**: use `roll("4d6L")` from `@randsum/roller` directly
- **Result type**: `number` (d20 + modifier)
- **Usage**: `roll(arg: FifthRollArgument)` — `modifier` is required

```typescript
interface FifthRollArgument {
  modifier: number                               // required; range -30 to +30
  rollingWith?: { advantage?: boolean; disadvantage?: boolean }
}

roll({ modifier: 5 })
roll({ modifier: 3, rollingWith: { advantage: true } })
roll({ modifier: -2, rollingWith: { disadvantage: true } })
```

### @randsum/root-rpg - Root RPG

- **Mechanics**: 2d6 + stat modifier
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Result type**: `'Strong Hit' | 'Weak Hit' | 'Miss'`
- **Usage**: `roll(bonus: number)` — range -20 to +20

```typescript
const result = roll(2)
result.result // 'Strong Hit' | 'Weak Hit' | 'Miss'
result.total  // 2d6 + bonus
```

### @randsum/pbta - Powered by the Apocalypse

- **Mechanics**: 2d6 + stat modifier (generic PbtA)
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Advantage**: roll 3d6, keep 2 highest; **Disadvantage**: roll 3d6, keep 2 lowest
- **Result type**: `'strong_hit' | 'weak_hit' | 'miss'`
- **Usage**: `roll(arg: PbtARollArgument)` — `stat` is required

```typescript
interface PbtARollArgument {
  stat: number         // required; range -3 to +5
  forward?: number     // one-time bonus; range -5 to +5
  ongoing?: number     // persistent bonus; range -5 to +5
  advantage?: boolean  // 3d6 keep highest 2
  disadvantage?: boolean
}

const result = roll({ stat: 2, forward: 1 })
result.result // 'strong_hit' | 'weak_hit' | 'miss'
```

**Games**: Dungeon World, Monster of the Week, Apocalypse World, Masks, and more.

### @randsum/salvageunion - Salvage Union

- **Mechanics**: d20 roll-under system; lower is better
- **Outcome**: 1 = critical success, 20 = critical failure; results looked up in reference tables
- **Result type**: `SalvageUnionRollRecord` (label, description, table metadata)
- **Usage**: `roll(tableName?: SalvageUnionTableName)` — defaults to `'Core Mechanic'`

```typescript
const result = roll()           // defaults to Core Mechanic table
const result = roll('Morale')   // specific table

result.result.label       // human-readable result name
result.result.description // result description
result.result.roll        // d20 value (1-20)
result.result.tableName   // table used
```

## Common Patterns

All game packages:

- Depend on `@randsum/roller` core package
- Return a result object with `result`, `total`, and `rolls` fields
- Export roll function and result types

## Quick Reference by System

| Game          | Notation / Pattern        | Outcome                                       |
| ------------- | ------------------------- | --------------------------------------------- |
| D&D 5E        | `roll({ modifier: 5 })`   | d20 + modifier                                |
| D&D 5E adv    | `2d20L+5` (roller)        | Higher of 2d20 + modifier                     |
| D&D 5E dis    | `2d20H+5` (roller)        | Lower of 2d20 + modifier                      |
| D&D 5E scores | `4d6L` (roller)           | Ability score (drop lowest)                   |
| Blades        | `roll(N)`                 | Highest die: 6 success, 4-5 partial, 1-3 fail |
| Daggerheart   | `roll({ modifier: N })`   | Hope/Fear interpretation                      |
| PbtA / Root   | `roll({ stat: N })`       | 10+ strong, 7-9 weak, 6- miss                 |
| Salvage Union | `roll('Core Mechanic')`   | Roll under; lower is better                   |
