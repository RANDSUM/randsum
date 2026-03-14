---
name: publish
description: Safely publish @randsum packages to npm with pre-flight checks and version bump guidance
disable-model-invocation: true
---

# Publish Packages

Safe release workflow for @randsum packages.

## Pre-flight Checks

Run these sequentially, stopping on any failure:

1. **Clean working tree**: `git status` must show no uncommitted changes
2. **On main branch**: `git branch --show-current` must be `main`
3. **Up to date**: `git pull --rebase` to ensure latest
4. **Full CI pipeline**: `bun run check:all` must pass (lint, format, typecheck, test, build, size, site)

If any check fails, report the failure and stop. Do not proceed.

## Version Bump

Ask the user which version bump to apply:
- **patch** (bug fixes, no new features)
- **minor** (new features, backward compatible)
- **major** (breaking changes)

Then run: `bun pm version <patch|minor|major>`

### Version Sync

When bumping a **core package** (`@randsum/roller`, `@randsum/notation`) to a new minor or major version, dependent packages must receive a corresponding bump:
- `@randsum/games`
- `@randsum/component-library`
- `@randsum/display-utils`

Patch bumps in core do not require dependent bumps.

## Changelog

Generate changelog content from git history:

```bash
git log --oneline $(git describe --tags --abbrev=0)..HEAD
```

Review the output and include relevant entries in the release notes.

## Publish

Run: `npm publish --workspaces --access=public`

## Post-publish

1. Show the published versions: `bun pm version`
2. Push commits and tags: `git push && git push --tags`
3. **GitHub Release**: Create a release from the new tag:
   ```bash
   gh release create v<version> --generate-notes
   ```
   Review and edit the generated notes before confirming.
4. **Deprecate old packages**: If game packages were published, check for and deprecate legacy per-game npm packages:
   ```bash
   npm deprecate @randsum/blades "Moved to @randsum/games — import from '@randsum/games/blades'"
   npm deprecate @randsum/fifth "Moved to @randsum/games — import from '@randsum/games/fifth'"
   npm deprecate @randsum/daggerheart "Moved to @randsum/games — import from '@randsum/games/daggerheart'"
   ```
   Only deprecate packages that actually exist on npm. Skip any that were never published.
