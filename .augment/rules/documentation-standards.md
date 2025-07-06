---
type: "always_apply"
description: "Standards for documentation, README files, and code comments across RANDSUM"
---

# Documentation Standards

## Overview

RANDSUM maintains comprehensive documentation to ensure developer success and project maintainability. All packages must include clear, accurate, and up-to-date documentation.

## README Requirements

### Standard README Structure

Every package must have a README.md with this structure:

```markdown
# @randsum/package-name

Brief description of the package and its purpose.

[![npm version](https://badge.fury.io/js/@randsum/package-name.svg)](https://www.npmjs.com/package/@randsum/package-name)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

\`\`\`bash
bun add @randsum/package-name
# or
npm install @randsum/package-name
\`\`\`

## Quick Start

\`\`\`typescript
import { roll } from '@randsum/package-name'

const result = roll('2d6+3')
console.log(result.total) // 5-15
\`\`\`

## API Reference

### Functions

#### roll(args)

Description of the function.

**Parameters:**
- \`args\` (RollArgument): Description of parameters

**Returns:**
- \`RollResult\`: Description of return value

**Example:**
\`\`\`typescript
const result = roll({ modifier: 5 })
\`\`\`

## Related Packages

- [@randsum/roller](../roller) - Core dice rolling functionality
- [@randsum/fifth](../fifth) - D&D 5th Edition dice rolling

## License

MIT © [Alex Jarvis](https://github.com/alxjrvs)
```

### Badge Requirements

Include these badges in all package READMEs:

- npm version badge
- License badge
- Build status (if applicable)
- Coverage badge (if applicable)

### Code Examples

All code examples must:

- Use TypeScript syntax
- Show both input and expected output
- Include error handling examples
- Demonstrate common use cases

```typescript
// ✅ Correct - Complete example with types
import type { RollArgument } from '@randsum/roller'
import { roll } from '@randsum/roller'

const args: RollArgument = { modifier: 5 }
const result = roll(args)

console.log(result.total) // number between 6-25
console.log(result.type)  // 'numeric'
```

## Code Comments

### When to Comment

Add comments for:

- Complex business logic
- Non-obvious algorithms
- Public API functions (minimal JSDoc)
- Workarounds or temporary solutions
- Performance-critical sections

### When NOT to Comment

Avoid comments for:

- Self-explanatory code
- Obvious variable names
- Simple getters/setters
- Code that TypeScript types already explain

```typescript
// ❌ Incorrect - Obvious comment
const total = 10 // Set total to 10

// ✅ Correct - Explains why, not what
const total = 10 // Default DC for standard difficulty checks
```

### Comment Style

Use consistent comment styles:

```typescript
// ✅ Correct - Single line comments
// This explains a single concept

// ✅ Correct - Multi-line comments for complex explanations
/**
 * This function implements the complex algorithm for determining
 * critical success conditions based on multiple dice results
 * and modifier interactions.
 */
```

## JSDoc Standards

### Minimal JSDoc Usage

RANDSUM prefers TypeScript types over JSDoc. Only use JSDoc for:

- Public API functions that need additional context
- Complex type relationships
- Examples that clarify usage

```typescript
// ✅ Correct - Minimal JSDoc for public API
/**
 * Rolls dice and returns the result with modifiers applied
 * @example
 * ```typescript
 * const result = roll({ modifier: 5 })
 * console.log(result.total) // 6-25
 * ```
 */
export function roll(args: RollArgument): RollResult {
  // Implementation
}
```

### JSDoc Tags to Use

When using JSDoc, prefer these tags:

- `@example` - Code examples
- `@throws` - Error conditions
- `@deprecated` - Deprecated functions
- `@since` - Version information

### JSDoc Tags to Avoid

Avoid these redundant tags:

- `@param` - TypeScript types are sufficient
- `@returns` - TypeScript return types are sufficient
- `@type` - Use TypeScript type annotations

## API Documentation

### Type Documentation

Document complex types with inline comments:

```typescript
// ✅ Correct - Type documentation
interface RollResult {
  /** The final calculated total */
  total: number | string
  /** Individual roll results before modifiers */
  rawResults: (number | string)[]
  /** Discriminator for result type */
  type: 'numeric' | 'custom' | 'mixed'
}
```

### Function Signatures

Keep function signatures self-documenting:

```typescript
// ✅ Correct - Self-documenting function
export function meetOrBeat(
  difficultyClass: number,
  rollArguments: RollArgument
): boolean {
  // Implementation
}

// ❌ Incorrect - Unclear parameters
export function check(dc: number, args: any): boolean {
  // Implementation
}
```

## Error Messages as Documentation

### Descriptive Error Messages

Error messages serve as runtime documentation:

```typescript
// ✅ Correct - Descriptive error message
if (dicePool < 1) {
  throw new Error(
    'Dice pool must be at least 1. Received: ' + dicePool
  )
}

// ❌ Incorrect - Vague error message
if (dicePool < 1) {
  throw new Error('Invalid dice pool')
}
```

### Error Context

Include context in error messages:

```typescript
// ✅ Correct - Error with context
throw new Error(
  `Failed to parse dice notation "${notation}". ` +
  'Expected format like "2d6" or "4d6L+3"'
)
```

## Documentation Maintenance

### Keeping Documentation Current

- Update README when API changes
- Verify examples still work
- Update version badges
- Review documentation in PRs

### Documentation Testing

Test documentation examples:

```typescript
// ✅ Correct - Test documentation examples
describe('README examples', () => {
  test('quick start example works', () => {
    const result = roll('2d6+3')
    expect(result.total).toBeGreaterThanOrEqual(5)
    expect(result.total).toBeLessThanOrEqual(15)
  })
})
```

## Internal Documentation

### Architecture Documentation

Document architectural decisions:

```markdown
# Architecture Decision Record: Modifier System

## Status
Accepted

## Context
Need to apply various modifiers to dice rolls (drop, reroll, etc.)

## Decision
Use class-based modifier system with inheritance

## Consequences
- Easy to extend with new modifiers
- Clear separation of concerns
- Consistent modifier interface
```

### Code Organization Documentation

Document complex code organization:

```typescript
// src/modifiers/
// ├── base/           # Base modifier classes
// ├── numeric/        # Numeric dice modifiers
// ├── custom/         # Custom dice modifiers
// └── index.ts        # Modifier exports
```

## External Documentation

### Website Documentation

For the main documentation website:

- Use Astro with TypeScript
- Follow TanStack.com design patterns
- Include interactive examples
- Provide comprehensive API reference

### Package Documentation

Each package should link to:

- Main documentation website
- GitHub repository
- npm package page
- Related packages

## Documentation Quality

### Review Checklist

Before publishing documentation:

- [ ] All examples are tested and work
- [ ] Links are valid and current
- [ ] Spelling and grammar are correct
- [ ] Code formatting is consistent
- [ ] API changes are reflected
- [ ] Version information is current

### Documentation Standards

- Use clear, concise language
- Prefer examples over lengthy explanations
- Structure information logically
- Use consistent terminology
- Include troubleshooting information

## Accessibility

### Documentation Accessibility

Ensure documentation is accessible:

- Use semantic HTML in markdown
- Provide alt text for images
- Use descriptive link text
- Maintain good contrast ratios
- Structure content with proper headings

### Code Example Accessibility

Make code examples accessible:

```typescript
// ✅ Correct - Descriptive variable names
const difficultyClass = 15
const rollResult = roll({ modifier: 3 })
const success = rollResult.total >= difficultyClass

// ❌ Incorrect - Unclear variable names
const dc = 15
const r = roll({ modifier: 3 })
const s = r.total >= dc
```

## Internationalization

### English-First Documentation

- Write all documentation in clear English
- Use simple, direct language
- Avoid idioms and colloquialisms
- Define technical terms when first used

### Code Comments Language

- All code comments in English
- Use consistent terminology
- Prefer standard technical terms
