# RANDSUM Game Systems

## Supported Game Packages

### @randsum/blades - Blades in the Dark

- **Mechanics**: d6 dice pools, keep highest result
- **Outcomes**: 6 = success, 4-5 = partial, 1-3 = failure
- **Special**: Multiple 6s = critical success
- **Usage**: `rollBlades(poolSize)`

### @randsum/daggerheart - Daggerheart RPG

- **Mechanics**: Hope/Fear d12 system
- **Roll**: 2d12 (one Hope, one Fear)
- **Outcome**: Higher die determines narrative, sum determines mechanical success
- **Usage**: `rollDaggerheart()`

### @randsum/fifth - D&D 5th Edition

- **Mechanics**: d20 with advantage/disadvantage
- **Advantage**: Roll 2d20, keep highest (`2d20L`)
- **Disadvantage**: Roll 2d20, keep lowest (`2d20H`)
- **Ability Scores**: `4d6L` (roll 4d6, drop lowest)
- **Usage**: `actionRoll(notation, { advantage: true })`

### @randsum/root-rpg - Root RPG

- **Mechanics**: 2d6 + stat modifier
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Usage**: `rollRootRpg(statValue)`

### @randsum/pbta - Powered by the Apocalypse

- **Mechanics**: 2d6 + stat modifier (generic PbtA)
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Special**: Supports advantage/disadvantage (3d6, keep 2), forward/ongoing bonuses
- **Usage**: `rollPbtA({ stat, forward?, ongoing?, advantage?, disadvantage? })`
- **Games**: Works for Dungeon World, Monster of the Week, Apocalypse World, Masks, and more

### @randsum/salvageunion - Salvage Union

- **Mechanics**: d20 roll-under system
- **Outcome**: Lower is better, 1 = critical success, 20 = critical failure
- **Usage**: `rollTable(tableName)`

## Common Patterns

All game packages:

- Depend on `@randsum/roller` core package
- Return `GameRollResult<TResult, TDetails, RollRecord>` interface
- Export roll function and result types
- Include comprehensive tests in `__tests__/` directories

## Quick Reference by System

| Game          | Notation / Pattern       | Outcome                                       |
| ------------- | ------------------------ | --------------------------------------------- |
| D&D 5E        | `2d20L+5` (advantage)    | Higher of 2d20 + modifier                     |
| D&D 5E        | `2d20H+5` (disadvantage) | Lower of 2d20 + modifier                      |
| D&D 5E        | `4d6L`                   | Ability score (drop lowest)                   |
| Blades        | `Nd6` (pool)             | Highest die: 6 success, 4-5 partial, 1-3 fail |
| Daggerheart   | 2d12                     | Hope/Fear interpretation                      |
| PbtA / Root   | 2d6 + stat               | 10+ strong, 7-9 weak, 6- miss                 |
| Salvage Union | d20 vs target            | Roll under target, lower is better            |
