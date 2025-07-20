# Shared Configurations

This directory contains shared configuration files used across multiple packages in the RANDSUM monorepo.

## bunfig.game-packages.toml

This configuration is used by all game-specific packages that have identical test and coverage requirements:

- `@randsum/blades`
- `@randsum/daggerheart`
- `@randsum/fifth`
- `@randsum/mcp`
- `@randsum/root-rpg`
- `@randsum/salvageunion`

### Configuration Details

- **Coverage**: Disabled by default for faster test runs
- **Coverage Thresholds**: Minimal requirements (lines=1.0, functions=0.0, branches=0.8, statements=0.8)
- **Coverage Reporter**: Text and LCOV formats
- **Ignore Patterns**: Standard patterns for node_modules, dist, type definitions, and test files

## tsconfig.game-packages.json

This TypeScript configuration is used by all game-specific packages that have identical compilation requirements:

- `@randsum/blades`
- `@randsum/daggerheart`
- `@randsum/fifth`
- `@randsum/root-rpg`
- `@randsum/salvageunion`

### TypeScript Configuration Details

- **Extends**: Root tsconfig.json for base TypeScript settings
- **Output Directory**: `dist/` for compiled JavaScript
- **Include**: All source files in `src/**/*`
- **Exclude**: Standard patterns for node_modules, dist, and test files
- **References**: Dependency on the `@randsum/roller` package

### Package-Specific Configurations

Some packages maintain their own tsconfig.json files due to different requirements:

- **`@randsum/roller`**: No external package references (base package)
- **`@randsum/mcp`**: Different module system and target settings for Node.js compatibility

## Usage

Packages use symbolic links to reference the shared configurations:

### Test Configuration

```bash
ln -s ../../shared-configs/bunfig.game-packages.toml packages/[package-name]/bunfig.toml
```

### TypeScript Configuration

```bash
ln -s ../../shared-configs/tsconfig.game-packages.json packages/[package-name]/tsconfig.json
```

This approach ensures:

- ✅ Single source of truth for common configurations
- ✅ Easy maintenance and updates
- ✅ Reduced duplication across packages
- ✅ Package-specific overrides when needed
