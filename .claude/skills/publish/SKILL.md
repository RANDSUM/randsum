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

## Publish

Run: `npm publish --workspaces --access=public`

## Post-publish

1. Show the published versions: `bun pm version`
2. Remind the user to push tags: `git push && git push --tags`
3. Suggest creating a GitHub release if this was a minor or major bump
