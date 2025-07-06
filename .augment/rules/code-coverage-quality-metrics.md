---
type: "agent_requested"
description: "Code coverage and quality metrics"
---

# Code Coverage and Quality

## Coverage Requirements

- Core packages: 90% lines, 95% functions
- Game packages: 85% lines, 90% functions
- All packages: 80% branches minimum

## Testing Patterns

### Unit Tests

Test all functions with edge cases:

```typescript
describe('rollDice', () => {
  it('should roll specified number of dice', () => {
    const result = rollDice({ sides: 6, quantity: 2 })
    expect(result.rolls).toHaveLength(2)
  })

  it('should handle edge cases', () => {
    expect(() => rollDice({ sides: 0 })).toThrow()
  })
})
```

### Integration Tests

Test complete workflows for game packages:

```typescript
describe('Game Integration', () => {
  it('should handle complete roll workflow', () => {
    const [result, details] = rollGame(args)
    expect(result).toMatchObject({ outcome: expect.any(String) })
  })
})
```

## Quality Metrics

- Keep cyclomatic complexity < 10
- Maintain high maintainability scores
- Monitor technical debt ratio
- Include performance benchmarks for critical paths
