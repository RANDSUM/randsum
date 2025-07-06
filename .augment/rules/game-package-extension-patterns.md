---
type: "always_apply"
description: "Standards for creating game-specific packages that extend RANDSUM core functionality"
---

# Game Package Extension Patterns

## Overview

Game packages extend RANDSUM's core roller functionality to provide game-specific dice rolling mechanics. Each game package follows consistent patterns while implementing unique game rules and mechanics.

## Package Structure Standards

### Required Package Structure

All game packages must follow this structure:

```
packages/game-name/
├── src/
│   ├── index.ts           # Main exports
│   ├── roll.ts            # Primary roll function
│   ├── types.ts           # Game-specific types
│   └── utils/             # Game-specific utilities
├── __tests__/
│   ├── roll.test.ts       # Roll function tests
│   └── integration.test.ts # Integration tests
├── package.json           # Package configuration
├── README.md              # Game-specific documentation
└── moon.yml               # Moon task configuration
```

### Package Naming

Use consistent naming patterns:

- Package name: `@randsum/game-name` (kebab-case)
- Directory name: `packages/game-name`
- Main function: `roll` (not `rollGameName`)

```json
// ✅ Correct - Package naming
{
  "name": "@randsum/daggerheart",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

## Core API Patterns

### Primary Roll Function

Every game package must export a `roll` function:

```typescript
// ✅ Correct - Standard roll function signature
export function roll(args: RollArgument): RollResult {
  // Game-specific implementation
  const coreResult = coreRoll(...rollArg(args))
  return processGameResult(coreResult, args)
}
```

### Consistent Return Types

Use discriminated unions for game results:

```typescript
// ✅ Correct - Game-specific result types
export type BladesResult = 'critical' | 'success' | 'partial' | 'failure'
export type RootResult = 'Strong Hit' | 'Weak Hit' | 'Miss'
export type DaggerheartResult = 'Critical Success' | 'Success with Hope' | 'Success with Fear' | 'Failure'

// Return tuple with game result and details
export function roll(args: RollArgument): [BladesResult, RollResult] {
  const details = coreRoll(...rollArg(args))
  const gameResult = interpretResult(details.total)
  return [gameResult, details]
}
```

### Optional Utility Functions

Provide game-specific utility functions when appropriate:

```typescript
// ✅ Correct - Game-specific utilities
export function meetOrBeat(dc: number, args: RollArgument): boolean {
  const [, details] = roll(args)
  return details.total >= dc
}

export function rollWithAdvantage(args: RollArgument): [RootResult, RollResult] {
  return roll({ ...args, rollingWith: 'Advantage' })
}
```

## Game Mechanics Implementation

### Advantage/Disadvantage Systems

Implement advantage systems consistently:

```typescript
// ✅ Correct - Advantage implementation
export type AdvantageDisadvantage = 'Advantage' | 'Disadvantage'

interface RollArgument {
  modifier?: number
  rollingWith?: AdvantageDisadvantage
}

function rollArg({ modifier = 0, rollingWith }: RollArgument): RollArgs {
  const baseArgs = [D20, 1, { plus: modifier }] as const
  
  if (rollingWith === 'Advantage') {
    return [D20, 2, { plus: modifier, drop: { highest: 1 } }]
  }
  
  if (rollingWith === 'Disadvantage') {
    return [D20, 2, { plus: modifier, drop: { lowest: 1 } }]
  }
  
  return baseArgs
}
```

### Critical Success/Failure

Handle critical results consistently:

```typescript
// ✅ Correct - Critical result handling
function interpretBladesResult(total: number, rawRolls: number[]): BladesResult {
  const sixes = rawRolls.filter(roll => roll === 6).length
  
  if (sixes >= 2) {
    return 'critical'
  }
  
  if (sixes >= 1) {
    return 'success'
  }
  
  if (total >= 4) {
    return 'partial'
  }
  
  return 'failure'
}
```

### Multi-Die Systems

Handle complex multi-die mechanics:

```typescript
// ✅ Correct - Multi-die system (Daggerheart)
export function roll({
  modifier = 0,
  amplifyHope = false,
  amplifyFear = false
}: RollArgument): RollResult {
  const rollArgs = rollArg({ modifier, amplifyHope, amplifyFear })
  const { rawResults: [hope, fear], total } = coreRoll(...rollArgs)
  
  if (hope === undefined || fear === undefined) {
    throw new Error('Failed to roll hope and fear dice')
  }
  
  return {
    hope,
    fear,
    total,
    result: interpretDaggerheartResult(hope, fear, total)
  }
}
```

## Type System Integration

### Game-Specific Types

Define clear game-specific types:

```typescript
// ✅ Correct - Game-specific type definitions
interface RollArgument {
  modifier?: number
  rollingWith?: AdvantageDisadvantage
  amplifyHope?: boolean  // Daggerheart-specific
  amplifyFear?: boolean  // Daggerheart-specific
  dicePool?: number      // Blades-specific
}

interface RollResult {
  total: number
  rawResults: number[]
  type: 'numeric'
  // Game-specific properties
  hope?: number          // Daggerheart
  fear?: number          // Daggerheart
  gameResult: GameResult // Game-specific result
}
```

### Type Guards

Implement type guards for game results:

```typescript
// ✅ Correct - Type guards for game results
export function isBladesResult(result: string): result is BladesResult {
  return ['critical', 'success', 'partial', 'failure'].includes(result)
}

export function isRootResult(result: string): result is RootResult {
  return ['Strong Hit', 'Weak Hit', 'Miss'].includes(result)
}
```

## Integration with Core Roller

### Dependency Management

All game packages depend on the core roller:

```json
// ✅ Correct - Core roller dependency
{
  "dependencies": {
    "@randsum/roller": "workspace:~"
  }
}
```

### Core Function Usage

Use core roller functions consistently:

```typescript
// ✅ Correct - Core roller integration
import { coreRoll, D6, D20 } from '@randsum/roller'
import type { RollArgs } from '@randsum/roller'

export function roll(args: RollArgument): [BladesResult, RollResult] {
  // Use core roller for actual dice rolling
  const rollArgs: RollArgs = [D6, args.dicePool || 2, {}]
  const coreResult = coreRoll(...rollArgs)
  
  // Apply game-specific interpretation
  const gameResult = interpretBladesResult(
    coreResult.total,
    coreResult.rawResults as number[]
  )
  
  return [gameResult, coreResult]
}
```

## Testing Patterns

### Game-Specific Testing

Test game mechanics thoroughly:

```typescript
// ✅ Correct - Game mechanics testing
describe('Blades in the Dark rolling', () => {
  test('returns critical on two sixes', () => {
    // Mock to return two sixes
    const mockRoll = spyOn(coreRoll).mockReturnValue({
      total: 12,
      rawResults: [6, 6],
      type: 'numeric',
      rolls: []
    })
    
    const [result] = roll({ dicePool: 2 })
    expect(result).toBe('critical')
    
    mockRoll.mockRestore()
  })
  
  test('handles zero dice pool', () => {
    const [result] = roll({ dicePool: 0 })
    expect(['failure', 'partial']).toContain(result)
  })
})
```

### Integration Testing

Test integration with core roller:

```typescript
// ✅ Correct - Integration testing
describe('integration with core roller', () => {
  test('uses core roller correctly', () => {
    const [gameResult, details] = roll({ modifier: 5 })
    
    // Test game-specific result
    expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(gameResult)
    
    // Test core roller integration
    expect(details.type).toBe('numeric')
    expect(typeof details.total).toBe('number')
    expect(Array.isArray(details.rawResults)).toBe(true)
  })
})
```

## Documentation Patterns

### Game-Specific README

Include game-specific documentation:

```markdown
# @randsum/blades

Dice rolling for Blades in the Dark RPG system.

## Game Mechanics

Blades in the Dark uses a dice pool system where:
- Roll a number of d6 equal to your dice pool
- 6 = Success, 4-5 = Partial Success, 1-3 = Failure
- Multiple 6s = Critical Success

## Usage

\`\`\`typescript
import { roll } from '@randsum/blades'

// Roll with 3 dice
const [result, details] = roll({ dicePool: 3 })
console.log(result) // 'critical' | 'success' | 'partial' | 'failure'
\`\`\`
```

### API Documentation

Document game-specific parameters:

```typescript
/**
 * Roll dice for Blades in the Dark
 * @param args - Roll arguments
 * @param args.dicePool - Number of d6 to roll (default: 2)
 * @returns Tuple of [game result, roll details]
 */
export function roll(args: RollArgument): [BladesResult, RollResult]
```

## Error Handling

### Game-Specific Validation

Validate game-specific parameters:

```typescript
// ✅ Correct - Game-specific validation
export function roll({ dicePool = 2, modifier = 0 }: RollArgument): [BladesResult, RollResult] {
  if (dicePool < 0) {
    throw new Error('Dice pool cannot be negative')
  }
  
  if (dicePool > 10) {
    throw new Error('Dice pool cannot exceed 10 dice')
  }
  
  // Proceed with rolling
}
```

### Graceful Degradation

Handle edge cases gracefully:

```typescript
// ✅ Correct - Graceful edge case handling
function interpretResult(total: number, rawRolls: number[]): BladesResult {
  // Handle empty rolls gracefully
  if (rawRolls.length === 0) {
    return 'failure'
  }
  
  // Normal interpretation logic
  const sixes = rawRolls.filter(roll => roll === 6).length
  // ... rest of logic
}
```

## Version Compatibility

### Backward Compatibility

Maintain backward compatibility:

```typescript
// ✅ Correct - Backward compatibility
export function roll(args: RollArgument): [BladesResult, RollResult]
export function roll(dicePool: number): [BladesResult, RollResult] // Legacy signature

export function roll(
  argsOrDicePool: RollArgument | number
): [BladesResult, RollResult] {
  // Handle both signatures
  const args = typeof argsOrDicePool === 'number' 
    ? { dicePool: argsOrDicePool }
    : argsOrDicePool
    
  // Implementation
}
```

### Migration Guides

Provide migration guides for breaking changes:

```markdown
## Migration from v1 to v2

### Breaking Changes

- `rollBlades()` renamed to `roll()`
- Return type changed from `BladesResult` to `[BladesResult, RollResult]`

### Migration

\`\`\`typescript
// v1
const result = rollBlades(3)

// v2
const [result, details] = roll({ dicePool: 3 })
\`\`\`
```
