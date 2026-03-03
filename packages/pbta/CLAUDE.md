# @randsum/pbta - Powered by the Apocalypse

## Overview

Generic implementation of Powered by the Apocalypse (PbtA) dice mechanics. Works for any PbtA game including:

- Dungeon World
- Monster of the Week
- Apocalypse World
- Masks
- And many others

## Core Mechanics

Standard PbtA roll:

- Roll 2d6 + stat modifier
- 10+ = strong hit (complete success)
- 7-9 = weak hit (partial success, success with cost)
- 6- = miss (failure)

## Usage

```typescript
import { roll } from "@randsum/pbta"

// Basic roll
const result = roll({ stat: 2 })
// result.result: 'strong_hit' | 'weak_hit' | 'miss'

// With bonuses
const result = roll({
  stat: 1,
  forward: 1, // One-time bonus
  ongoing: 0 // Persistent bonus
})

// With advantage (roll 3d6, keep 2 highest)
const result = roll({
  stat: 2,
  advantage: true
})

// With disadvantage (roll 3d6, keep 2 lowest)
const result = roll({
  stat: 2,
  disadvantage: true
})
```

## Implementation Details

Uses `createGameRoll` factory from `@randsum/roller`:

- Validates stat range (-3 to 5)
- Validates bonus ranges (-5 to 5)
- Converts to roll options with appropriate modifiers
- Interprets result based on PbtA thresholds

## Testing

Tests verify:

- Outcome thresholds (10+, 7-9, 6-)
- Advantage/disadvantage mechanics
- Bonus application
- Validation of input ranges
