# Contributing to RANDSUM

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- [Bun](https://bun.sh) >= 1.4.0 (enforced by `engines`)
- [Node.js](https://nodejs.org) >= 22.23.4 (enforced by `engines`)
- Git

## Setup

```bash
git clone https://github.com/RANDSUM/randsum.git
cd randsum
bun install
bun run check      # Verify everything works
```

## Project Structure

See the Architecture section of [`AGENTS.md`](AGENTS.md) for every package and app. The site (`apps/site/`) also builds the notation spec, served at notation.randsum.dev (randsum.dev 301s `/spec` there).

## Adding a New Game

Game packages are code-generated from `.randsum.json` specs. To add a game:

1. Create `packages/games/<shortcode>.randsum.json` with the game spec
2. Run `bun run --filter @randsum/games gen` to generate the TypeScript module
3. Add tests in `packages/games/__tests__/<shortcode>.test.ts`
4. Add a subpath export to `packages/games/package.json`

See `packages/games/AGENTS.md` for detailed patterns and conventions.

## Testing

- Framework: `bun:test` (`import { describe, expect, test } from 'bun:test'`)
- Tests go in `__tests__/` directories
- Property-based tests use `fast-check` (suffix: `.property.test.ts`)
- Coverage target: 80% project, 70% patch
- Run all tests: `bun run test`
- Run one package: `bun run --filter @randsum/roller test`

## Code Style

- TypeScript strict mode with `isolatedDeclarations` and `exactOptionalPropertyTypes`
- `const` only (no `let`), `import type` for type-only imports
- No `any`, no `as unknown as T` -- use type guards
- Explicit return types on exported functions
- Biome formatter: no semicolons, single quotes, no trailing commas

See the root `AGENTS.md` for the full TypeScript conventions reference.

Run `bun run fix:all` to auto-fix lint and format issues.

## Pull Request Process

1. Branch from `main`
2. Make focused changes with tests
3. Run `bun run check` before pushing
4. Use conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
5. Open a PR with a clear description of what and why

### Git Hooks (Lefthook)

`bun install` installs the hooks through the root `prepare` script. It skips that when `$CI` is set, so CI runners never install them and a CI `git push` does not run pre-push.

**pre-commit** runs `bun install --frozen-lockfile` first (nothing else runs if it fails), then in parallel: Biome (`check --write` — lint + format, covering `.astro`), `typecheck`, and a codegen check (`gen:check`) when a `.randsum.json` spec changed. A failing step prints its own fix.

**pre-push** is a heavier gauntlet — expect it to take a while. It runs `build` first (nothing else runs if it fails), then in parallel: codegen check (`gen:check`), the full test suite, and `knip`. A failing step prints its own fix. See `lefthook.yml` for the exact config. Do not `--no-verify` past a real failure.

## Releases

Releases are automated via [changesets](https://github.com/changesets/changesets) and npm OIDC Trusted Publishing. Nobody runs a publish command by hand in the normal flow.

1. Add a changeset with your change: `bun run changeset` (writes a markdown file under `.changeset/`).
2. On merge to `main`, the `Release` workflow (`.github/workflows/publish.yml`) runs after CI succeeds. With changesets pending, its `version` job opens or updates a `chore: version packages` PR (applying `bun changeset version` to bump versions and roll per-package `CHANGELOG.md` entries) using a GitHub App token, because a PR pushed with `GITHUB_TOKEN` never gets CI. Once that PR is merged, its `publish` job, the only one holding the npm OIDC id-token, publishes the changed packages and pushes a `name@version` tag and GitHub release for each.
3. Publishing runs `bun run publish`: `bun run build`, then `bun scripts/publish.ts`. There is no `check` or size step there, because Release runs only after CI passed on that commit. The script packs each package with `bun pm pack` (resolving `workspace:~` to a real semver range) and publishes the tarball with `npm publish`. In CI, auth is npm Trusted Publishing (no `NPM_TOKEN`) and `--provenance` attests the build.

**npm version in Release:** the `publish` job sets up Node 24, which bundles npm >= 11.5.1, the minimum Trusted Publishing and provenance need.

**Trusted publisher per package:** every published package needs its own Trusted Publisher entry on npmjs.com (package Settings → Trusted Publisher → GitHub Actions, repository `RANDSUM/randsum`, workflow `publish.yml`). A brand-new package cannot have one until it exists on the registry, so its first release is a local `bun scripts/publish.ts --otp=<CODE>` run by the owner.

**`workspace:~` warning:** never run a bare `npm publish` from a package directory. npm ships the literal `workspace:~` string, which consumers cannot resolve. Publishing always goes through `scripts/publish.ts`.

**Local fallback (rare):** `bun scripts/publish.ts --otp=<CODE>` (the npm account has 2FA set to `auth-and-writes`), optionally with `--dry-run`. Local runs omit `--provenance`. Publish order is fixed in the script: `@randsum/roller` → `@randsum/games` → `@randsum/mcp` → `@randsum/ui` → `@randsum/notation-spec`.

### Versioning

`@randsum/roller` and `@randsum/games` are **linked** in `.changeset/config.json`, so they always bump together. `updateInternalDependencies` is `minor`, so a minor or major bump to core updates dependents' `workspace:~` ranges; patch bumps stay local. `@randsum/mcp` bundles roller and games as devDependencies, which never trigger a release, so `bun run check:changesets` fails when a pending changeset releases roller or games without also releasing mcp. Every `private: true` workspace (site, discord-bot, api) is skipped by `privatePackages: { version: false, tag: false }`.

## Resources

- [GitHub Issues](https://github.com/RANDSUM/randsum/issues) -- bugs and feature requests
- [Project Board](https://github.com/orgs/RANDSUM/projects/2/views/1) -- roadmap and priorities
- [RANDSUM Dice Notation (RDN) Specification](https://notation.randsum.dev/) -- the formal spec for dice notation syntax
- [Architecture Decisions](docs/adr/) -- key design decisions and rationale
