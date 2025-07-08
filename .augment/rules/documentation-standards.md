---
type: "agent_requested"
description: "Documentation standards for RANDSUM packages"
---

# Documentation Standards

## README Structure

Each package needs README.md with:

- Package name and description
- Installation instructions (bun/npm)
- Quick start TypeScript example
- API reference with parameters and return types
- Related packages links

## Code Comments

**Use comments for:**

- Complex business logic
- Non-obvious algorithms
- Workarounds or temporary solutions

**Avoid comments for:**

- Self-explanatory code
- What TypeScript types already explain

## JSDoc Usage

Minimal JSDoc only for:

- Public API functions needing context
- `@example` for usage clarification
- `@throws` for error conditions

Avoid redundant `@param` and `@returns` - TypeScript types are sufficient.
