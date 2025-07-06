---
type: "always_apply"
description: "Modifier system design patterns"
---

# Modifier System Design

## Core Interface

All modifiers implement:

```typescript
interface Modifier {
  name: string
  apply(rolls: number[], options?: ModifierOptions): ModifierResult
}

interface ModifierResult {
  rolls: number[]
  logs: ModifierLog[]
}

interface ModifierLog {
  modifier: string
  options: ModifierOptions | undefined
  added: number[]
  removed: number[]
}
```

## Key Requirements

- Never mutate input `rolls` array - always return new arrays
- Always include proper `ModifierLog` with `added` and `removed` arrays
- Support modifier chaining by applying sequentially
- Use deep array comparison to detect specific additions/removals
