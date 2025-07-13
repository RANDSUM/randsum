---
type: "agent_requested"
description: "Documentation and Publishing Rules"
---

# Documentation and Publishing Rules

## Documentation Generation

### TypeDoc Configuration

- **Primary tool**: TypeDoc for API documentation generation
- **Configuration**: Centralized in `typedoc.json` at repository root
- **Entry points**: All packages in `packages/` directory
- **Output**: Generated to `docs/` directory
- **Themes**: Use default TypeDoc theme with custom branding

### Documentation Structure

```
docs/
├── @randsum/
│   ├── roller/          # Core dice rolling package
│   ├── blades/          # Blades in the Dark system
│   ├── daggerheart/     # Daggerheart system
│   └── ...              # Other game system packages
├── packages.md          # Package overview
└── README.md           # Main documentation
```

### API Documentation Standards

- **JSDoc comments**: Required for all exported functions, classes, and types
- **Examples**: Include usage examples in documentation
- **Parameters**: Document all parameters with types and descriptions
- **Return values**: Document return types and possible values
- **Throws**: Document exceptions that may be thrown

## Package Publishing

### NPM Publishing Strategy

- **Registry**: Publish to public NPM registry
- **Scope**: All packages use `@randsum/` scope
- **Access**: Public packages (`--access=public`)
- **Versioning**: Semantic versioning (semver) for all packages

### Publishing Workflow

1. **Pre-publish checks**: Tests, linting, type checking, and build
2. **Version bumping**: Use Moon tasks for version management
3. **Build verification**: Ensure clean build before publishing
4. **Publishing**: Automated through Moon tasks with proper dependencies

### Package Metadata Requirements

```json
{
  "name": "@randsum/package-name",
  "version": "x.y.z",
  "description": "Clear, concise package description",
  "author": {
    "name": "Alex Jarvis",
    "url": "https://github.com/alxjrvs"
  },
  "license": "MIT",
  "homepage": "https://github.com/RANDSUM/randsum",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/RANDSUM/randsum.git",
    "directory": "packages/package-name"
  },
  "keywords": ["dice", "rpg", "typescript", "randsum"]
}
```

## Version Management

### Semantic Versioning

- **Major**: Breaking changes to public API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible
- **Pre-release**: Alpha/beta versions for testing

### Version Bumping Tasks

- **`bun moon :patch`**: Increment patch version
- **`bun moon :minor`**: Increment minor version
- **`bun moon :major`**: Increment major version
- **`bun moon :version`**: Interactive version selection

### Release Process

1. Ensure all tests pass and code is properly formatted
2. Update documentation if needed
3. Bump version using appropriate Moon task
4. Build and test the package
5. Publish to NPM registry
6. Tag the release in Git

## README Documentation Standards

### Package README Structure

1. **Title and description**: Clear package purpose
2. **Installation**: NPM/Bun installation commands
3. **Usage examples**: Basic and advanced usage
4. **API reference**: Link to generated TypeDoc
5. **Contributing**: Guidelines for contributors
6. **License**: MIT license information

### Code Examples

- Include runnable code examples
- Show both TypeScript and JavaScript usage
- Demonstrate common use cases
- Include error handling examples

## CLI Documentation

### Binary Packages

- Document CLI usage in package README
- Include help text and examples
- Show common command patterns
- Document configuration options

### CLI Help Standards

```bash
# Usage examples
npx randsum 2d20    # Roll two twenty-sided dice
npx randsum 4d6L    # Character stat roll (drop lowest)
npx randsum 2d20H   # Roll with advantage
```

## Documentation Maintenance

### Automated Documentation

- **TypeDoc generation**: Automated through Moon tasks
- **README updates**: Manual but templated
- **Changelog**: Maintain for major packages
- **Migration guides**: For breaking changes

### Documentation Quality

- Keep examples up-to-date with current API
- Test code examples to ensure they work
- Update documentation with new features
- Remove outdated information promptly

## Publishing Security

### Package Security

- **No secrets**: Never include API keys or secrets in packages
- **Dependency scanning**: Regular security audits
- **Access control**: Limit publishing access to maintainers
- **Verification**: Use `--dry-run` for testing publish process

### File Inclusion

- **`files` field**: Explicitly list files to include in package
- **`.npmignore`**: Exclude development files
- **Source maps**: Include for debugging support
- **License files**: Include in all packages
