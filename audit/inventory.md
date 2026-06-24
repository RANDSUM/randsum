# Inventory

_Generated: 2026-06-23_

## Engagement

- **Client:** randsum
- **Project:** randsum-monorepo
- **Audit date:** 2026-06-23
- **Slug:** randsum-randsum-monorepo-2026-06-23

## Working directory

`/Users/jarvis/Code/@RANDSUM` (audited via clean worktree `audit-run` off `main`)

Layout: **Single-repo** (Bun workspace monorepo — one git repo, many sub-projects)

## Repos

### `randsum-monorepo`

- **Description:** Bun workspace monorepo for a dice-rolling ecosystem targeting tabletop RPGs. Core is `@randsum/roller`, a zero-dependency dice engine with built-in notation parsing/validation; game packages wrap it with game-specific interpretation; apps consume it (CLI, Discord bot, docs sites, Expo playground). Published to npm under `@randsum`.
- **Primary language:** TypeScript
- **Other languages:** Astro (docs sites), minimal JS (config)
- **LOC (approx):** ~53,600 across source + tests (roller ~26.2k, games ~11.8k, dice-ui ~4.0k, site ~3.0k, discord-bot ~3.0k, expo ~2.7k, rdn ~2.2k, cli ~0.5k, scripts ~0.2k). Includes 193 test files.
- **Manifests:** root `package.json` (private, `randsum-monorepo`), per-package `package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.json` (+ `tsconfig.apps.json`, `tsconfig.packages.json`, `tsconfig.typedoc.json`), `knip.json`, `eslint.config.js`, `.dependency-cruiser.cjs`, `lefthook.yml`, `osv-scanner.toml`, `codecov.yml`
- **Frameworks / runtimes:** Bun (runtime + test + bundler via `bunup`); TypeScript 6 strict (`isolatedDeclarations`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`); ESLint 10 + Prettier; Astro 6 + Starlight (site, rdn); React Native + Expo (expo, dice-ui); discord.js (discord-bot); fast-check (property tests); Changesets (versioning/release)
- **Default branch:** `main`
- **Recent activity:** Active — 91 commits in the last 90 days; most recent commit 2026-06-23. 1,343 total commits; first commit 2018-03-06. Primary contributor Alex Jarvis (+ dependabot, Claude, github-actions).
- **Infrastructure artifacts:**
  - **IaC:** No
  - **Containers:** No (no Dockerfile / compose)
  - **Orchestrators:** No (no k8s / helm; `render.yaml` worker is a managed PaaS blueprint, counted under runtime config)
  - **Runtime config:** Yes (examples: `render.yaml`, `apps/site/netlify.toml`, `apps/rdn/netlify.toml`, `apps/expo/app.json`, `apps/expo/eas.json`)
  - **Qualifies for infrastructure dimension:** Yes
- **Notes:** Workspace structure — publishable packages: `@randsum/roller` (2.0.0, zero-dep core), `@randsum/games` (3.0.1, depends on roller), `@randsum/dice-ui` (2.0.0, RN component lib), `@randsum/cli` (2.0.0). Private apps: `@randsum/discord-bot` (1.1.2, Render worker), `@randsum/expo` (1.0.1, EAS native+web), `@randsum/site` (1.1.2, randsum.dev docs, Netlify), `@randsum/rdn` (1.0.0, notation.randsum.dev, Netlify). Game packages depend only on roller, never on each other. Codegen pipeline generates game packages from `.randsum.json` specs.

## Source artifacts

| Path                             | Classification     | Summary                                                                                         |
| -------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `CLAUDE.md` (root + per-package) | runbook / guidance | Architecture, conventions, commands, build/publish/versioning rules for agents and contributors |
| `README.md`                      | doc                | Ecosystem overview and package index                                                            |
| `CONTRIBUTING.md`                | doc                | Contribution workflow                                                                           |
| `SECURITY.md`                    | doc                | Security policy / disclosure                                                                    |
| `CODE_OF_CONDUCT.md`             | doc                | Community standards                                                                             |
| `DEPLOY.md` (apps/)              | runbook            | App deployment instructions                                                                     |
| `runbooks/`                      | runbook            | Operational runbooks                                                                            |
| `docs/`                          | doc                | Additional documentation                                                                        |
| `llms.txt`                       | doc                | LLM-oriented project description                                                                |
| `.changeset/`                    | release metadata   | Pending Changesets version-bump entries                                                         |

## Infrastructure summary

| Repo             | IaC | Containers | Orchestrators | Runtime config | Qualifies |
| ---------------- | --- | ---------- | ------------- | -------------- | --------- |
| randsum-monorepo | N   | N          | N             | Y              | Y         |

**Dispatch `infrastructure` dimension:** Yes (runtime config present — Render worker blueprint, two Netlify site configs, Expo EAS/app config).

## Confidence

- **Engagement metadata** was derived via the headless-mode fallback (no interactive Q&A): `client=randsum`, `project=randsum-monorepo`, `audit_date=today`. Override by editing this file if a different client/project label is wanted.
- **LOC** is a fast extension-based count (`find` + `wc -l`) over `.ts/.tsx/.js/.jsx/.astro`, excluding `node_modules`/`dist`/`build`/`.next`/`coverage`. It includes test files, so source-only LOC is lower. Not a `cloc`-grade measurement.
- **Single-repo classification** is unambiguous: one `.git`, root `package.json` marked `private` with Bun workspaces; sub-projects enumerated under one repo entry per the monorepo edge-case guidance.
- **Infrastructure** qualifies solely on runtime-config / PaaS deploy manifests (Render, Netlify, Expo EAS). There is no IaC, no containers, and no self-managed orchestration — the infrastructure dimension should scope to managed-PaaS posture, not cloud/k8s.
