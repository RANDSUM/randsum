# Randsum Dice Notation

## Overview

Dice notation is a compact way to represent dice rolls and their modifications. For example, `4d20+2` means "roll four twenty-sided dice, then add two".

Randsum extends standard dice notation with powerful modifiers like dropping lowest rolls, rerolling specific values, and ensuring unique results.

## Basic Syntax

All notation in randsum is case-insensitive (`2d8` = `2D8`).

### Standard Rolls

```typescript
// Roll one d20
roll(20) // number argument
roll('1d20') // notation string
roll({
  sides: 20,
  quantity: 1
})

// Roll four d6
roll('4d6')
roll({
  sides: 6,
  quantity: 4
})
```

### Custom-Faced Dice

Roll dice with non-numeric faces:

```typescript
// Roll a coin (heads/tails) four times
import { rollCustomFaces } from '@randsum/dice'

rollCustomFaces('4d{HT}')
rollCustomFaces({
  sides: ['H', 'T'],
  quantity: 4
})

// Roll Fudge/Fate dice
rollCustomFaces('4d{++--  }') // Plus, minus, blank faces
rollCustomFaces({
  sides: ['+', '+', '-', '-', ' ', ' '],
  quantity: 4
})
```

Note: Custom-faced dice ignore modifiers and always return a total of 0.

## Modifiers

### Basic Arithmetic

```typescript
roll('4d6+2') // Add 2 to total
roll({
  sides: 6,
  quantity: 4,
  modifiers: { plus: 2 }
})

roll('4d6-1') // Subtract 1 from total
roll({
  sides: 6,
  quantity: 4,
  modifiers: { minus: 1 }
})
```

### Cap Modifiers

Limit roll values to specific ranges:

```typescript
roll('4d20C{>18}') // Cap rolls over 18 to 18
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { greaterThan: 18 }
  }
})

roll('4d20C{<3}') // Cap rolls under 3 to 3
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { lessThan: 3 }
  }
})

roll('4d20C{<2,>19}') // Cap rolls under 2 to 2 and over 19 to 19
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: {
      greaterThan: 19,
      lessThan: 2
    }
  }
})
```

### Drop Modifiers

Drop specific dice from the results:

```typescript
roll('4d6L') // Drop lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { lowest: 1 } }
})

roll('4d6L2') // Drop 2 lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { lowest: 2 } }
})

roll('4d6H') // Drop highest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { highest: 1 } }
})

roll('4d6H2') // Drop 2 highest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { highest: 2 } }
})

// Drop by value
roll('4d20D{>17}') // Drop rolls over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { greaterThan: 17 } }
})

roll('4d20D{<5}') // Drop rolls under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { lessThan: 5 } }
})

roll('4d20D{8,12}') // Drop 8s and 12s
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { exact: [8, 12] } }
})
```

### Reroll Modifiers

Reroll dice matching certain conditions:

```typescript
roll('4d20R{>17}') // Reroll results over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { greaterThan: 17 } }
})

roll('4d20R{<5}') // Reroll results under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { lessThan: 5 } }
})

roll('4d20R{8,12}') // Reroll 8s and 12s
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { exact: [8, 12] } }
})

roll('4d20R{<5}3') // Reroll under 5, max 3 attempts
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    reroll: {
      lessThan: 5,
      max: 3
    }
  }
})
```

### Replace Modifiers

Replace specific results with new values:

```typescript
roll('4d20V{8=12}') // Replace 8s with 12s
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: 8,
      to: 12
    }
  }
})

roll('4d20V{>17=20}') // Replace results over 17 with 20
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { greaterThan: 17 },
      to: 20
    }
  }
})

roll('4d20V{<5=1}') // Replace results under 5 with 1
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { lessThan: 5 },
      to: 1
    }
  }
})
```

### Unique Results

Force unique rolls within a pool:

```typescript
roll('4d20U') // All results must be unique
roll({
  sides: 20,
  quantity: 4,
  modifiers: { unique: true }
})

roll('4d20U{5,10}') // Unique except 5s and 10s can repeat
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    unique: { notUnique: [5, 10] }
  }
})
```

### Exploding Dice

Roll additional dice on maximum results:

```typescript
roll('4d20!') // Roll an extra d20 for each 20 rolled
roll({
  sides: 20,
  quantity: 4,
  modifiers: { explode: true }
})
```

### Combining Modifiers

Modifiers can be chained together:

```typescript
roll('4d6L+2') // Drop lowest, add 2
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    drop: { lowest: 1 },
    plus: 2
  }
})

roll('2d20H!+1') // Drop highest, explode, add 1
roll({
  sides: 20,
  quantity: 2,
  modifiers: {
    drop: { highest: 1 },
    explode: true,
    plus: 1
  }
})

roll('4d6R{<3}L') // Reroll under 3, then drop lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    reroll: { lessThan: 3 },
    drop: { lowest: 1 }
  }
})
```

## Notes

- When using notation strings with custom faces, each face must be a single character
- The options object interface allows for multi-character custom faces
- See the [Getting Started Guide](../../GETTING_STARTED.md) for more usage examples

## Attribution

The extended notation syntax was inspired by [Sophie's Dice](https://sophiehoulden.com/dice/documentation/notation.html#keep).
