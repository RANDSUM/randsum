---
type: "agent_requested"
description: "Testing and Quality Assurance Rules"
---

## Testing Framework: Bun Test

This project uses Bun's built-in test runner for all testing:

- **Test files**: Use `.test.ts` or `.spec.ts` suffix
- **Test location**: Place tests in `__tests__/` directory or alongside source files
- **Test command**: `bun test` for running tests
- **Imports**: Use standard ES modules imports for test utilities

### Test Structure

```typescript
import { describe, expect, test } from "bun:test"
import { functionToTest } from "../src/module"

describe("Module Name", () => {
  test("should do something specific", () => {
    expect(functionToTest()).toBe(expectedResult)
  })
})
```

### Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Create helper functions and fixtures in `__tests__/support/` directory
- Test both happy path and error conditions

## Code Quality Standards

### ESLint Configuration

- **Base config**: Extends TypeScript ESLint recommended rules
- **Security**: Includes security-focused linting rules
- **Import sorting**: Automatically sorts and organizes imports
- **React support**: React-specific rules for components
- **Prettier integration**: Conflicts resolved with Prettier

### Linting Rules Enforcement

- No unused variables or imports
- Consistent naming conventions (camelCase for variables, PascalCase for types)
- Prefer `const` over `let` where possible
- Require explicit return types for exported functions
- Enforce proper error handling patterns

### Code Formatting: Prettier

- **Line length**: 80 characters maximum
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: ES5 compatible
- **Bracket spacing**: Consistent object formatting

## Type Safety Standards

### TypeScript Strict Mode

- Enable all strict type checking options
- No implicit `any` types allowed
- Strict null checks enforced
- Strict function types required

### Type Definitions

- Export all public types and interfaces
- Use branded types for domain-specific values
- Prefer type unions over enums where appropriate
- Document complex types with JSDoc comments

## Testing Best Practices

### Test Coverage

- Aim for high test coverage on core functionality
- Focus on testing public APIs and critical paths
- Test error conditions and edge cases
- Use descriptive test names that serve as documentation

### Test Data Management

- Create reusable test fixtures and factories
- Use deterministic test data (avoid random values in tests)
- Clean up test state between tests
- Mock external dependencies appropriately

### Performance Testing

- Include performance benchmarks for critical algorithms
- Test with realistic data sizes
- Monitor memory usage in long-running operations
- Validate performance regressions in CI

## Quality Gates

### Pre-commit Checks

- TypeScript compilation must pass
- All linting rules must pass
- Code formatting must be consistent
- Tests must pass

### CI/CD Quality Gates

- Full test suite execution
- Type checking across all packages
- Linting validation
- Format checking
- Security vulnerability scanning

## Documentation Quality

### Code Documentation

- Use JSDoc for all exported functions and classes
- Include usage examples in documentation
- Document parameter types and return values
- Explain complex algorithms and business logic

### README Standards

- Include installation instructions
- Provide usage examples
- Document API interfaces
- Include contribution guidelines
- Maintain up-to-date dependency information

## Error Handling Standards

### Error Types

- Use custom error classes for domain-specific errors
- Include meaningful error messages
- Provide error codes for programmatic handling
- Log errors appropriately for debugging

### Validation

- Validate input parameters at public API boundaries
- Use type guards for runtime type checking
- Provide clear validation error messages
- Handle edge cases gracefully
