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

### Package-Specific Configurations

Some packages maintain their own bunfig.toml files due to different requirements:

- **`@randsum/roller`**: Higher coverage thresholds (95%/95%/90%/95%) and additional ignore patterns

## Usage

Packages use symbolic links to reference the shared configuration:

```bash
ln -s ../../shared-configs/bunfig.game-packages.toml packages/[package-name]/bunfig.toml
```

This approach ensures:
- ✅ Single source of truth for common configurations
- ✅ Easy maintenance and updates
- ✅ Reduced duplication across packages
- ✅ Package-specific overrides when needed
