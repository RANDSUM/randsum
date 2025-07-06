---
type: "always_apply"
description: "Guidelines for creating consistent and maintainable TypeScript types and interfaces"
---

# Type Definitions and Interface Design Standards

## Overview

RANDSUM uses TypeScript's type system extensively to provide type safety and excellent developer experience. All types and interfaces must follow consistent patterns and naming conventions.

## Naming Conventions

### Interface and Type Names

Use PascalCase for all type definitions:

```typescript
// ✅ Correct - PascalCase
interface RollResult { }
type BladesResult = 'critical' | 'success'
interface NumericRollOptions { }

// ❌ Incorrect - Other cases
interface rollResult { }  // camelCase
type blades_result = string  // snake_case
```

### Generic Type Parameters

Use descriptive single letters or full names:

```typescript
// ✅ Correct - Descriptive parameters
interface BaseRollResult<TParams extends RollParams> { }
interface ModifiedRolls<T extends RollParams = RollParams> { }

// ❌ Incorrect - Non-descriptive
interface BaseRollResult<A, B, C> { }
```

## Union Types vs Enums

### Prefer Union Types

Use union types instead of enums for better tree-shaking:

```typescript
// ✅ Correct - Union types
export type RollResultType = 'numeric' | 'custom' | 'mixed'
export type BladesResult = 'critical' | 'success' | 'partial' | 'failure'

// ❌ Incorrect - Enums
enum RollResultType {
  Numeric = 'numeric',
  Custom = 'custom',
  Mixed = 'mixed'
}
```

### Discriminated Unions

Use discriminated unions for type safety:

```typescript
// ✅ Correct - Discriminated union with type field
interface NumericRollResult {
  type: 'numeric'
  total: number
  rolls: number[]
}

interface CustomRollResult {
  type: 'custom'
  total: string
  rolls: string[]
}

type RollResult = NumericRollResult | CustomRollResult
```

## Interface Design Patterns

### Base Interfaces

Use base interfaces for common properties:

```typescript
// ✅ Correct - Base interface pattern
interface BaseRollResult {
  rolls: (NumericRollPoolResult | CustomRollPoolResult)[]
  rawResults: (string | number)[]
  total: string | number
  type: 'numeric' | 'custom' | 'mixed'
}

interface NumericRollResult extends BaseRollResult {
  type: 'numeric'
  rolls: NumericRollPoolResult[]
  rawResults: number[]
  total: number
}
```

### Generic Constraints

Use generic constraints for type safety:

```typescript
// ✅ Correct - Generic constraints
interface ModifiedRolls<T extends RollParams = RollParams> {
  rolls: T['options'] extends CustomRollOptions ? string[] : number[]
  total: T['options'] extends CustomRollOptions ? string : number
  logs: ModifierLog[]
}
```

### Optional vs Required Properties

Be explicit about optional properties:

```typescript
// ✅ Correct - Clear optional properties
interface RollArgument {
  modifier?: number  // Optional
  rollingWith?: AdvantageDisadvantage  // Optional
  amplifyHope?: boolean  // Optional with default
}

interface RequiredRollParameters {
  sides: number  // Required
  quantity: number  // Required
}
```

## Function Type Definitions

### Function Overloads

Use function overloads for different argument types:

```typescript
// ✅ Correct - Function overloads
function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
```

### Callback Types

Define callback types clearly:

```typescript
// ✅ Correct - Clear callback types
type RollOneFunction = () => number
type ModifierApplyFunction = (
  bonuses: NumericRollBonus,
  parameters?: RequiredNumericRollParameters,
  rollOne?: RollOneFunction
) => NumericRollBonus
```

## Type Organization

### File Structure

Organize types by domain in separate files:

```typescript
// types/index.ts - Barrel file
export type * from './dice'
export type * from './results'
export type * from './modifiers'
export type * from './options'
export type * from './parameters'
export type * from './validation'
```

### Type Dependencies

Organize types to minimize circular dependencies:

```typescript
// ✅ Correct - Clear dependency hierarchy
// 1. Basic types (dice.ts)
// 2. Options (options.ts) - depends on basic types
// 3. Parameters (parameters.ts) - depends on options and dice
// 4. Results (results.ts) - depends on parameters
```

## Utility Types

### Use Built-in Utility Types

Leverage TypeScript's utility types:

```typescript
// ✅ Correct - Using utility types
type RequiredNumericRollParameters = Required<
  Omit<NumericRollOptions, 'modifiers'>
>

type PartialRollOptions = Partial<NumericRollOptions>
```

### Custom Utility Types

Create reusable utility types:

```typescript
// ✅ Correct - Custom utility types
type NonEmptyArray<T> = [T, ...T[]]
type ValueOf<T> = T[keyof T]
```

## Type Guards

### Runtime Type Checking

Implement type guards for runtime safety:

```typescript
// ✅ Correct - Type guard implementation
export function isNumericRollResult(
  result: RollResult
): result is NumericRollResult {
  return result.type === 'numeric'
}

export function isCustomRollParams(
  params: RollParams
): params is CustomRollParams {
  return Array.isArray(params.options.sides)
}
```

### Type Predicate Functions

Use type predicates for better type narrowing:

```typescript
// ✅ Correct - Type predicate
function isRollResult(value: unknown): value is RollResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'total' in value &&
    'rolls' in value
  )
}
```

## Game Package Type Patterns

### Consistent Result Types

Game packages should follow consistent patterns:

```typescript
// ✅ Correct - Consistent game result pattern
export type RootStrongHit = 'Strong Hit'
export type RootWeakHit = 'Weak Hit'
export type RootMiss = 'Miss'
export type RootResult = RootStrongHit | RootWeakHit | RootMiss

export type BladesResult = 'critical' | 'success' | 'partial' | 'failure'
```

### Argument Types

Use consistent argument type patterns:

```typescript
// ✅ Correct - Consistent argument pattern
interface RollArgument {
  modifier?: number
  rollingWith?: 'Advantage' | 'Disadvantage'
}

interface MeetOrBeatArgument extends RollArgument {
  target: number
}
```

## Documentation in Types

### JSDoc for Complex Types

Use JSDoc for complex type definitions:

```typescript
/**
 * Represents the result of a dice roll with modifiers applied
 * @template T - The type of roll parameters used
 */
interface BaseRollPoolResult<P extends RollParams = RollParams> {
  /** The original parameters used for this roll */
  parameters: P
  /** The raw result before any modifiers */
  rawResult: number | string
  /** Discriminator for the type of roll */
  type: 'numeric' | 'custom'
}
```

### Inline Comments for Complex Logic

```typescript
// ✅ Correct - Inline comments for complex type logic
type ModifiedRolls<T extends RollParams = RollParams> = {
  // Use string[] for custom dice, number[] for numeric dice
  rolls: T['options'] extends CustomRollOptions ? string[] : number[]
  // Total is string for custom dice, number for numeric dice
  total: T['options'] extends CustomRollOptions ? string : number
  logs: ModifierLog[]
}
```
