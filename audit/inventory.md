# Inventory

_Generated: 2026-05-10_

## Engagement

- **Client:** randsum
- **Project:** randsum-monorepo
- **Audit date:** 2026-05-10
- **Slug:** randsum-randsum-monorepo-2026-05-10

## Working directory

`/Users/jarvis/Code/RANDSUM/@RANDSUM`

Layout: **Single-repo (Bun workspace monorepo)**

## Repos

### `randsum-monorepo` (root)

- **Description:** Bun workspace monorepo for the RANDSUM dice ecosystem. Zero-dependency core dice engine, six TTRPG game packages (codegen-driven), CLI, Discord bot, Astro docs site, Expo cross-platform playground.
- **Primary language:** TypeScript (strict + isolatedDeclarations + exactOptionalPropertyTypes)
- **Other languages:** Astro (docs site), JSON (game specs), TSX (React Native / dice-ui)
- **LOC (approx):** ~24,500 TS/TSX across packages + apps source (excluding generated, dist, node_modules)
- **Default branch:** main
- **Recent activity:** Highly active — 269 commits in last 90 days, 33 in last 30 days. Most recent commit: 2026-05-10 (feat(schema): add resultShape).
- **First commit:** 2018-03-06 (8 years of history)

#### Packages (workspaces)

| Workspace          | Version | Status         | LOC src   | Tests          | Bundle limits                                    | Notes                                                                                                                            |
| ------------------ | ------- | -------------- | --------- | -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/roller`  | 1.3.0   | Public (npm)   | ~7,778    | 109 test files | index 16KB, tokenize 6.5KB, docs 20KB, trace 5KB | Zero runtime deps. Notation parser native. Subpaths: `/roll`, `/errors`, `/validate`, `/tokenize`, `/docs`, `/trace`.            |
| `packages/games`   | 1.3.0   | Public (npm)   | ~5,815    | 44 test files  | 15KB per game; 33KB salvageunion                 | Codegen-driven from `.randsum.json` specs. Subpaths: `/blades`, `/daggerheart`, `/fifth`, `/pbta`, `/root-rpg`, `/salvageunion`. |
| `packages/dice-ui` | unknown | Likely private | ~3,780    | 5 test files   | n/a                                              | Shared UI components (.tsx web, .native.tsx RN, ink/ TUI).                                                                       |
| `apps/cli`         | 1.3.0   | Public (npm)   | ~205      | 4 test files   | n/a                                              | Ink-based TUI dice roller (`randsum` binary). Depends on dice-ui.                                                                |
| `apps/expo`        | private | Private        | (managed) | 10 test files  | n/a                                              | Cross-platform playground (web + iOS + Android). Deployed to randsumapp.expo.app.                                                |
| `apps/discord-bot` | unknown | Private        | ~1,176    | 11 test files  | n/a                                              | Discord slash-command bot. Public-invite directory submission outstanding.                                                       |
| `apps/site`        | private | Private        | ~3,799    | 4 test files   | n/a                                              | Astro docs site (randsum.dev). Purple-accent theme, prefetch disabled.                                                           |
| `apps/rdn`         | private | Private        | ~1,954    | 0 test files   | n/a                                              | Notation spec site (notation.randsum.dev).                                                                                       |

#### Game specs (`.randsum.json`)

| Spec                        | Game system               |
| --------------------------- | ------------------------- |
| `blades.randsum.json`       | Blades in the Dark        |
| `daggerheart.randsum.json`  | Daggerheart               |
| `fifth.randsum.json`        | D&D 5e                    |
| `pbta.randsum.json`         | Powered by the Apocalypse |
| `root-rpg.randsum.json`     | Root: The Tabletop RPG    |
| `salvageunion.randsum.json` | Salvage Union             |

Outstanding spec-driven candidates per project memory: Fate Core (#940), Pathfinder 2e (#942), Ironsworn (#944).

#### Manifests + tooling

- Root `package.json` — bun workspace declaration, central catalog (fast-check, react, mitata, typescript, @types/bun), overrides pinning ~14 transitive deps
- Bun lockfile present (572 KB)
- `bunfig.toml` — bun runtime config
- `eslint.config.js` — flat ESLint config (7.4 KB)
- `lefthook.yml` — pre-commit (parallel: install, lint --fix, format, typecheck) + pre-push (build, codegen, test, audit, knip)
- `knip.json` — unused file/dep detection
- `codecov.yml` — coverage thresholds (project 80%, patch 70%)
- `tsconfig.json` — strict mode with isolatedDeclarations, exactOptionalPropertyTypes, noUncheckedIndexedAccess
- `.changeset/` — Changesets-driven versioning (with @changesets/changelog-github)

#### Frameworks / runtimes

- **Bun ≥1.3.10** (required), Node ≥18 declared for npm consumers
- **TypeScript 5.9 (workspace) / 6.0 (root devDep)** — note mismatch
- **bunup 0.16.31** — bundler for ESM-only output
- **Astro 6.0.8** (site)
- **Expo SDK 55** (expo app)
- **Ink 6.8 + React 19.2** (CLI TUI)
- **ESLint 10 + Prettier 3.8** (linting)
- **fast-check 4.6** (property tests)
- **size-limit 12** (bundle gates)
- **mitata 1.0** (benchmarks)
- **devalue / flatted** (serialization deps from site)

#### CI / GitHub workflows

- `ci.yml` — main test + lint + build pipeline
- `claude.yml` + `claude-code-review.yml` — Claude-powered review automation
- `auto-merge.yml` — automated merging policy
- `publish.yml` — `bun publish` orchestration (per CLAUDE.md: never `npm publish`)
- `security.yml` — `bun audit` security scan
- `expo-web-deploy.yml` + `expo-native-deploy.yml` — Expo cross-platform deploy

#### Pre-existing audits + planning artifacts

The repo already contains substantial design memory:

- `docs/adr/` — 18 ADRs, recently re-bucketed (memory ref)
- `docs/plans/`, `docs/specs/`, `docs/superpowers/` — design docs
- `briefs/`, `plans/`, `retro/`, `events/` — project tracking
- Project memory file (`MEMORY.md`) references multiple prior audits:
  - "Release Audit 2 (2026-03-14)"
  - "Four-panel audit 2026-03-14"
  - "Developer Experience & Patterns Audit (2026-03-14)"
  - "SCRAM Notation Roller Refactor"
  - "Sprint Plan — Unified Roller App"

## Source artifacts

| Path                                     | Classification   | Summary                                                                                 |
| ---------------------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `CLAUDE.md` (root)                       | Engineering doc  | Codebase conventions: TS strict, bun, conventional commits, hooks, publishing rules.    |
| `packages/roller/CLAUDE.md`              | Engineering doc  | Roller API surface, subpath exports, modifier system invariants, internal architecture. |
| `packages/games/CLAUDE.md`               | Engineering doc  | Codegen pipeline, `.randsum.json` spec format, adding-a-game procedure.                 |
| `apps/cli/CLAUDE.md`                     | Engineering doc  | CLI structure (small).                                                                  |
| `CONTRIBUTING.md`                        | Onboarding doc   | Contribution workflow.                                                                  |
| `CODE_OF_CONDUCT.md`                     | Governance doc   | CoC.                                                                                    |
| `CHANGELOG.md`                           | Release history  | 3.2K.                                                                                   |
| `docs/adr/*`                             | ADRs             | 18 numbered ADRs covering modifier co-location, notation scope, etc.                    |
| `docs/plans/*`, `docs/specs/*`           | Design docs      | Detailed planning records.                                                              |
| `briefs/`, `plans/`, `retro/`, `events/` | Project tracking | Open scope, working notes.                                                              |
| `MEMORY.md` (user-private)               | Working memory   | Project state, decisions, audit summaries 2026-03-14 to 2026-03-25.                     |

## Confidence

- **High** on package boundaries, build/test/lint commands, language identification, CI surface.
- **Medium** on per-app LOC totals: `apps/expo/src` showed 0 files via the `src/` scan because Expo's source layout places entry files at the app root (`App.tsx`, `app/`); the 10 test files were detected. Treat Expo LOC as "not measured" rather than zero.
- **Medium** on `packages/dice-ui` external API status — not declared `private`, but no `version` examined here.
- **Headless-mode fallback engagement** — client/project derived from working directory (`@RANDSUM`); audit date defaulted to today (2026-05-10). User may edit if needed.
- **Pre-existing audit material** is rich — this audit should cross-reference / supersede rather than re-discover findings already captured under "Release Audit 2 (2026-03-14)" and the four-panel audit.
