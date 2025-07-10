---
type: "agent_requested"
description: "TypeScript type definitions and interfaces"
---

# Type Definitions

## Core Patterns

### Discriminated Unions

Use discriminated unions with `type` field for result types:

```typescript
interface NumericResult {
  total: number
  rawResults: number[]
}

interface CustomResult {
  type: "custom"
  results: string[]
}

type RollResult = NumericResult | CustomResult
```

### Option Objects

Use option objects for function parameters:

```typescript
interface RollOptions {
  sides: number
  quantity?: number
  modifier?: number
}

function roll(options: RollOptions): RollResult
```

### Tuple Returns

Game packages use tuple returns:

```typescript
function rollGame(args: GameArgs): [GameResult, RollDetails]
```

## Organization

- Use separate `types.ts` files for complex definitions
- Use `export type *` for type-only exports
- Organize interfaces with required properties first
- Use meaningful names with consistent suffixes (Options, Result, Details)
