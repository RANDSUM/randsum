---
type: "always_apply"
description: "Optimized linting and formatting configuration for RANDSUM monorepo"
---

# Optimized Linting and Formatting Configuration

## ESLint Configuration

### Main Configuration (`eslint.config.js`)
- **Modern flat config** with TypeScript integration
- **Performance optimizations**: Caching enabled, unused disable directives reported
- **Enhanced rules**: Security, performance, and code quality rules
- **Type-safe imports**: Consistent type imports/exports enforced
- **Comprehensive ignores**: All build artifacts and generated files

### Key Rules Added
- `@typescript-eslint/consistent-type-imports`: Enforce type-only imports
- `@typescript-eslint/prefer-readonly`: Encourage immutability
- Security rules: `no-eval`, `no-implied-eval`, `no-new-func`
- Performance rules: `no-await-in-loop`, `prefer-object-spread`
- Code quality: `prefer-const`, `object-shorthand`, `prefer-template`

### Robo.js Specific Configuration
- Separate config for Discord bot with relaxed rules
- Allows console logging for bot functionality
- Node.js and ES2022 globals configured

## Prettier Configuration

### Enhanced File Type Support
- **JSON/JSONC**: Double quotes, no trailing commas
- **Markdown/MDX**: 100 char width, preserve prose wrapping
- **YAML**: Double quotes, no bracket spacing
- **TOML**: Double quotes for consistency
- **package.json**: 120 char width for better readability

### Integration
- Seamless ESLint integration via `eslint-plugin-prettier`
- Comprehensive ignore patterns for build artifacts
- Framework-specific ignores (Astro, Robo.js)

## EditorConfig Enhancements

### Modern File Type Support
- **Web technologies**: CSS, SCSS, HTML, Astro, Vue, Svelte
- **Shell scripts**: Bash, Zsh support
- **Docker**: Dockerfile formatting
- **Configuration files**: ENV, ignore files

### Alignment with Prettier
- Consistent line endings (LF)
- 80 character line width default
- 2-space indentation for most files
- Proper quote type settings

## Performance Optimizations

### ESLint Caching
- Cache location: `.eslintcache`
- Included in gitignore patterns
- Moon tasks updated to use caching

### Ignore Patterns
- Comprehensive build artifact ignoring
- Framework-specific patterns
- Generated file exclusions

## Usage

### Development Commands
```bash
# Lint with caching
bun moon :lint

# Format all files
bun moon :format

# Check formatting without changes
bun moon :formatCheck

# Fix both linting and formatting
bun run style:fix
```

### CI/CD Integration
- All configurations work with Moon build system
- Caching improves CI performance
- Comprehensive error reporting

## Best Practices

1. **Type Safety**: Use type-only imports where possible
2. **Security**: Avoid eval and dynamic code execution
3. **Performance**: Prefer modern JavaScript patterns
4. **Consistency**: Let tools handle formatting
5. **Maintainability**: Follow naming conventions
