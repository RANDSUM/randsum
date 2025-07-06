---
type: "always_apply"
description: "Standards for code coverage, quality metrics, and continuous improvement"
---

# Code Coverage and Quality Metrics Standards

## Overview

RANDSUM maintains high code quality through comprehensive testing, coverage requirements, and automated quality metrics. All packages must meet established thresholds for coverage and quality.

## Coverage Requirements

### Minimum Coverage Thresholds

All packages must maintain these minimum coverage levels:

- **Functions**: 100% coverage (all functions must be tested)
- **Branches**: 80% minimum (conditional logic coverage)
- **Lines**: 90% minimum (line execution coverage)
- **Statements**: 90% minimum (statement execution coverage)

### Coverage Configuration

Configure coverage in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = { 
  lines = 0.9, 
  functions = 1.0, 
  branches = 0.8, 
  statements = 0.9 
}
coverageReporter = ["text", "html", "lcov"]
coverageDir = "coverage"
```

### Coverage Reporting

Generate multiple coverage report formats:

- **Text**: Console output for CI/CD
- **HTML**: Detailed browser-viewable reports
- **LCOV**: Integration with external tools

## Quality Metrics

### Code Quality Tools

Use these tools for quality assessment:

- **ESLint**: Static code analysis and style enforcement
- **TypeScript**: Type checking and compile-time error detection
- **Prettier**: Code formatting consistency
- **Bun Test**: Test execution and coverage

### Quality Gates

Establish quality gates for all code:

```typescript
// ✅ Correct - Quality gate example
// All functions must have:
// 1. Type annotations
// 2. Error handling
// 3. Unit tests
// 4. Documentation (if public API)

export function roll(args: RollArgument): RollResult {
  // Input validation
  if (!args) {
    throw new Error('Roll arguments are required')
  }
  
  // Implementation with proper error handling
  try {
    return performRoll(args)
  } catch (error) {
    throw new Error(`Roll failed: ${error.message}`)
  }
}
```

## Testing Standards

### Test Coverage by Category

Different types of code require different coverage approaches:

#### Core Functions (100% Coverage Required)

- All public API functions
- Critical business logic
- Error handling paths
- Edge cases and boundary conditions

```typescript
// ✅ Correct - Comprehensive core function testing
describe('roll function', () => {
  test('handles valid input', () => {
    const result = roll({ modifier: 5 })
    expect(result).toBeDefined()
  })
  
  test('throws error for invalid input', () => {
    expect(() => roll(null as any)).toThrow()
  })
  
  test('handles edge cases', () => {
    const result = roll({ modifier: 0 })
    expect(result.total).toBeGreaterThan(0)
  })
})
```

#### Utility Functions (90% Coverage Minimum)

- Helper functions
- Internal utilities
- Configuration handlers

#### Type Guards and Validators (100% Coverage Required)

- Runtime type checking
- Input validation
- Data transformation

```typescript
// ✅ Correct - Complete type guard testing
describe('isRollResult type guard', () => {
  test('returns true for valid roll result', () => {
    const validResult = { type: 'numeric', total: 10, rolls: [], rawResults: [] }
    expect(isRollResult(validResult)).toBe(true)
  })
  
  test('returns false for invalid input', () => {
    expect(isRollResult(null)).toBe(false)
    expect(isRollResult({})).toBe(false)
    expect(isRollResult('string')).toBe(false)
  })
})
```

## Performance Metrics

### Performance Testing

Include performance validation in tests:

```typescript
// ✅ Correct - Performance testing
test('roll performance is acceptable', () => {
  const start = performance.now()
  
  // Perform multiple operations
  for (let i = 0; i < 1000; i++) {
    roll('4d6L')
  }
  
  const duration = performance.now() - start
  expect(duration).toBeLessThan(1000) // Should complete in under 1 second
})
```

### Memory Usage

Monitor memory usage for intensive operations:

```typescript
// ✅ Correct - Memory usage testing
test('memory usage remains stable', () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  // Perform memory-intensive operations
  const results = Array.from({ length: 10000 }, () => roll('1d20'))
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory
  
  // Memory increase should be reasonable (less than 10MB)
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
})
```

## Continuous Integration Metrics

### CI/CD Quality Gates

Implement quality gates in CI/CD pipeline:

```yaml
# Example GitHub Actions quality gate
- name: Run Tests with Coverage
  run: bun test --coverage
  
- name: Check Coverage Thresholds
  run: |
    if [ $(bun test --coverage --reporter=json | jq '.coverage.lines.pct') -lt 90 ]; then
      echo "Line coverage below 90%"
      exit 1
    fi
```

### Quality Reporting

Generate quality reports for each build:

- Coverage reports (HTML and LCOV)
- Test results (JUnit format)
- Linting results
- Type checking results

## Code Quality Monitoring

### Automated Quality Checks

Run quality checks on every commit:

```json
// package.json scripts
{
  "scripts": {
    "quality": "bun run lint && bun run type-check && bun run test:coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test:coverage": "bun test --coverage"
  }
}
```

### Quality Metrics Dashboard

Track quality metrics over time:

- Coverage trends
- Test execution time
- Code complexity
- Technical debt

## Exception Handling for Coverage

### Coverage Exclusions

Only exclude code from coverage when justified:

```typescript
// ✅ Correct - Justified coverage exclusion
function debugLog(message: string): void {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development') {
    console.log(message)
  }
}
```

### Acceptable Exclusions

- Debug-only code paths
- Platform-specific code that can't be tested in CI
- Error conditions that are impossible to reproduce in tests

### Unacceptable Exclusions

- Core business logic
- Public API functions
- Error handling that can be tested
- Complex conditional logic

## Quality Improvement Process

### Regular Quality Reviews

Conduct regular quality reviews:

- Weekly coverage reports
- Monthly quality metric analysis
- Quarterly technical debt assessment

### Quality Improvement Actions

When quality metrics fall below thresholds:

1. **Immediate**: Block merges until fixed
2. **Short-term**: Add missing tests and coverage
3. **Long-term**: Refactor complex code to improve testability

### Technical Debt Management

Track and manage technical debt:

- Identify areas with low coverage
- Prioritize improvements based on risk
- Set improvement targets and timelines

## Reporting and Visualization

### Coverage Reports

Generate comprehensive coverage reports:

```bash
# Generate HTML coverage report
bun test --coverage --coverage-reporter=html

# Generate LCOV for external tools
bun test --coverage --coverage-reporter=lcov
```

### Quality Dashboards

Maintain quality dashboards showing:

- Current coverage percentages
- Test execution trends
- Quality gate pass/fail rates
- Performance metrics over time

## Integration with Development Workflow

### Pre-commit Hooks

Ensure quality before commits:

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bun run quality
```

### Pull Request Checks

Require quality checks for all PRs:

- All tests must pass
- Coverage thresholds must be met
- No linting errors
- Type checking must pass

### Release Quality Gates

Additional quality requirements for releases:

- 100% function coverage
- All integration tests pass
- Performance benchmarks met
- Security scans clean
