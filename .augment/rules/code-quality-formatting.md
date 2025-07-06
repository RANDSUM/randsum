---
type: "always_apply"
description: "Enforce consistent code quality, linting, and formatting across RANDSUM"
---
# Code Quality and Formatting Standards

## Overview

RANDSUM maintains high code quality through strict ESLint configuration and consistent Prettier formatting. All code must pass linting and formatting checks before being committed.

## ESLint Configuration

### Base Rules

- Extends TypeScript ESLint recommended, strict, and stylistic configurations
- Integrates with Prettier for formatting consistency
- Uses project service for optimal performance with monorepo structure

### Required Rules

```javascript
{
  "@typescript-eslint/explicit-function-return-type": "error",
  "@typescript-eslint/explicit-member-accessibility": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/naming-convention": [
    "error",
    { "selector": "interface", "format": ["PascalCase"] },
    { "selector": "typeAlias", "format": ["PascalCase"] }
  ]
}
```

### Import Sorting

- Use `sort-imports` rule with specific member syntax order
- Allow separated groups for better organization
- Ignore declaration sort to work with import/export tools

## Prettier Configuration

### Formatting Standards

- **No semicolons**: `"semi": false`
- **Single quotes**: `"singleQuote": true`
- **2-space indentation**: `"tabWidth": 2`
- **No trailing commas**: `"trailingComma": "none"`
- **80 character line width**: `"printWidth": 80`
- **LF line endings**: `"endOfLine": "lf"`

### File-Specific Overrides

- **JSON files**: Use double quotes
- **Markdown files**: 100 character width, preserve prose wrapping

## EditorConfig Integration

### Universal Settings

- UTF-8 character encoding
- LF line endings with final newline
- Trim trailing whitespace
- 2-space indentation for most files

### Language-Specific Settings

- **TypeScript/JavaScript**: Single quotes, K&R brace style
- **JSON**: No final newline
- **YAML**: 2-space indentation
- **Markdown**: No trailing whitespace trimming

## Ignored Files and Directories

### Build Outputs
- `dist/`, `build/`, `out/`
- `coverage/`
- `node_modules/`

### Generated Files
- `*.d.ts.map`, `*.js.map`
- Lock files (`*.lock`, `yarn.lock`, `package-lock.json`)
- Binary files (images, fonts)

### Configuration Files
- `.prototools`, `bunfig.toml` (maintain original formatting)

## Integration with Moon Tasks

- Linting runs via `moon :lint` command
- Formatting runs via `moon :format` command
- Both are included in CI pipeline via `moon :ci`
- Auto-fixing available via `moon :lint -- --fix`

## Pre-commit Requirements

All code must:
1. Pass ESLint checks without errors
2. Be formatted according to Prettier configuration
3. Pass TypeScript type checking
4. Have no unused imports or variables (except those prefixed with `_`)

## Function and Variable Naming

- Functions should use `camelCase`
- Classes and interfaces use `PascalCase`
- Constants use `SCREAMING_SNAKE_CASE` when truly constant
- Private class members should be prefixed with `private` keyword
- Unused parameters should be prefixed with underscore
