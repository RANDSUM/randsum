# Security

**Grade: A- (89 / 100)**

> **Confidence: High** for the core library and CI/secrets posture (static
> review covered the full parse/validate path, all package manifests, every GH
> workflow, both `.env.example` files, and a live `bun audit` run). **Medium**
> for the runtime apps (discord-bot, two Astro/Netlify sites, Expo) — these were
> reviewed statically; no running instance, deployed config, or Render/Netlify
> dashboard state was inspected. Findings are hypothesis-grade per the audit
> charter; none are exploitation-confirmed.

## Summary

`randsum-monorepo` is, at its center, a **pure-computation TypeScript library**
(`@randsum/roller`, zero runtime dependencies) plus a set of thin consumers (a
CLI, a Discord bot, two static docs sites, an Expo playground). This shape
collapses most of the application-security attack surface: there is no database,
no HTTP server in the published packages, no user accounts, no session/cookie
layer, and no SQL anywhere in the repo. The dominant real risk for a dice
library — **untrusted-input parsing leading to DoS** (ReDoS or unbounded
compute) — is explicitly and competently mitigated with regex hygiene and hard
numeric bounds.

Security process maturity is notably high for a project of this size: a
committed `SECURITY.md` with a disclosure path, `bun audit --audit-level=high`
gated in both pre-push (lefthook) and a scheduled GitHub Actions workflow, an
`osv-scanner.toml` that documents every accepted advisory with a reachability
rationale, and **all third-party GitHub Actions pinned to full commit SHAs**.
No hardcoded secrets were found in source or config. The Discord bot reads its
token strictly from the environment and Render declares all three Discord
secrets `sync: false` (dashboard-managed, never committed).

The grade is held just below A by the absence of an automated secret-scanning
gate (gitleaks/detect-secrets) on commit, the use of `Math.random` as the
default RNG (acceptable for entertainment dice but worth an explicit
fairness/security note), and a small set of dev/build-time-only moderate
advisories that cannot be force-resolved without major Astro/Expo bumps.

## Findings

### Secrets exposure — Clean

- Pattern grep across all `*.ts/.tsx/.js/.json/.yml/.yaml/.toml/.env*/.sh`
  (AWS keys, private-key PEM headers, `ghp_`/`sk_live_`/Slack `xox*` tokens,
  inline `password=`/`api_key=` assignments, bearer tokens) returned **zero
  matches** in tracked source.
- `.env` is gitignored (`.env`, `.env.*.local`). Only `.env.example` files are
  committed, and both contain placeholders (`your_bot_token_here`) — no real
  values.
- `apps/expo/.env.example` is exemplary: it documents that `EXPO_PUBLIC_`-prefixed
  vars are inlined into the client bundle and explicitly warns **"Never put a
  server-side service-role key in an EXPO*PUBLIC* variable."** (CWE-312 awareness
  baked into the contract.) The Expo app currently reads no secrets at all
  (Supabase removed 2026-03-25).
- `apps/discord-bot/render.yaml` declares `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`,
  `DISCORD_GUILD_ID` with `sync: false` — they live in the Render dashboard, not
  in the repo. `config.ts` reads them from `process.env` and throws at startup
  if the required ones are missing (fail-closed).

**Finding S-1 (Low):** No automated secret-scanning gate on commit. Pattern grep
and `bun audit` run, but a dedicated scanner (gitleaks / detect-secrets / GitHub
push protection) is not wired into lefthook or CI. The repo is clean today;
adding the gate prevents future accidental commits and is cheap.
_CWE-798 (prevention). OWASP A07._

### Input validation & DoS resistance (the core risk) — Strong

The roller parses **untrusted notation strings** (e.g. via the Discord `/roll`
command, where any user supplies the input). This is the one place a pure
library can be attacked, and it is well-defended:

- **No catastrophic-backtracking regexes.** All notation/modifier patterns
  (`coreNotationPattern`, explode `/(?<!!)!(?!!...)(\{...\})?/`, count, replace,
  cap, draw-die) use bounded, linear constructs — character classes, anchored
  alternations, and `\d+` runs without nested quantifiers like `(\d+)+` or
  `(.*)+`. No ReDoS-prone construct was observed. _(CWE-1333 — not observed.)_
- **Hard numeric bounds enforced on the parse/options path**
  (`packages/roller/src/lib/utils/validation.ts`, called from
  `roll/parseArguments.ts:291-292` and `lib/optionsValidation.ts`):
  - `MAX_QUANTITY = 10000` — caps dice-per-pool allocation/CPU.
  - `MAX_SIDES = 1_000_000` — caps RNG range.
  - `MAX_REPEAT_COUNT = 1000`, `MAX_REPEAT_DEPTH = 10` — caps the `xN` repeat
    operator and its nesting.
  - `MAX_REROLL_ATTEMPTS = 99`, `DEFAULT_EXPLOSION_DEPTH = 1000` — cap reroll/
    unique loops and explode/compound/penetrate depth so "unlimited" notation
    (`!!0`, `R{...}`) terminates.
    These directly defend against unbounded-allocation / unbounded-loop DoS
    (CWE-400, CWE-1284) from hostile notation. This is the single most important
    control in the codebase and it is present and tested (stress tests at 9999
    iterations per the project conventions).
- `roll()` throws `RandsumError` subclasses on invalid input; the Discord
  `/roll` handler (`apps/discord-bot/src/commands/roll.ts`) validates via
  `notation()` and wraps the call in try/catch, returning a safe error embed —
  no stack traces or internals leak to users.
- **No injection sinks anywhere:** no SQL, no `child_process`/`exec`, no
  `eval`/`Function`, no `pickle`-style deserialization, no template-injection
  surface. Discord embeds are built with the discord.js `EmbedBuilder` (the
  library handles encoding); user notation is echoed back inside fenced/plain
  embed fields, not interpolated into markup. _(CWE-89/78/94/79 — not observed.)_

### Auth / Authz — N/A (library) / minimal (bot)

- The published packages have **no authentication or authorization** surface —
  correct for a library/CLI. Mark OWASP A01/A07 N/A for `@randsum/roller`,
  `@randsum/games`, `@randsum/cli`.
- The Discord bot's "auth" is the gateway token + slash-command framework;
  Discord enforces who can invoke commands. The bot performs no privileged
  action, reads no per-user data store, and has no admin path — there is no
  IDOR/object-level-authz surface. `interactionCreate.ts` routes by command name
  with a not-found guard and per-command try/catch; errors are captured (Sentry
  seam) and surfaced as ephemeral messages. No `if (user.is_admin)`-style ad-hoc
  checks exist. This is appropriate for the bot's (read-only, compute-only)
  scope.

### Dependency / supply chain — Strong, with documented residuals

- `@randsum/roller` is **zero runtime dependencies**; `@randsum/games` depends
  only on roller; `@randsum/cli` has no runtime deps. The published attack
  surface is essentially the standard library. `@randsum/discord-bot` adds a
  single runtime dep, `discord.js ^14.26.4` (current major, actively
  maintained).
- `bun audit --audit-level=high` → **clean** (exit 0, no high/critical).
- Full `bun audit` → **5 advisories: 4 moderate, 1 low**, all transitive through
  **dev/build tooling** (esbuild dev-server, js-yaml/yaml in Astro build,
  `uuid` via the private Expo app, OpenTelemetry baggage). Each is documented
  in `osv-scanner.toml` with a reachability rationale and confirmed **not
  reachable from any of the three published packages**. This is exactly the
  right posture — suppress with justification, keep the high gate blocking.
- **All GitHub Actions are pinned to 40-char commit SHAs** with version comments
  (`actions/checkout@de0fac…`, `codecov/codecov-action@0565863…`,
  `anthropics/claude-code-action@dde2242…`, `expo/expo-github-action@c7b66a9…`,
  `dependabot/fetch-metadata@25dd0e3…`). This defends against the tag-mutation
  supply-chain attacks that have hit the Actions ecosystem (e.g. the
  `tj-actions` class). Excellent and frequently-missed control.
  _(CWE-1357 — mitigated.)_

**Finding S-2 (Low / Informational):** The default RNG is `Math.random`
(`roll/pipeline.ts:37`, `lib/random/coreRandom.ts`). For an entertainment dice
library this is fine and performant, and the API allows injecting a custom
`randomFn`. But because the product's value proposition _is_ dice fairness, it
is worth (a) a note that `Math.random` is **not** cryptographically secure and
must never be relied on where unpredictability matters (e.g. any future
money/wager or commit-reveal use), and (b) documenting that consumers needing
CSPRNG-grade output should pass `{ randomFn }` backed by
`crypto.getRandomValues`. _(CWE-338 — informational; not a vulnerability in the
current entertainment context.)_

### OSS license scan — Clean

- All four publishable packages (`@randsum/roller`, `@randsum/games`,
  `@randsum/cli`, plus `@randsum/dice-ui`) are **MIT**. Private apps
  (`discord-bot`, `site`, `rdn`) are MIT; `@randsum/expo` has no license field
  but is `private: true` (intentional, not a finding). Root `package.json` is
  `private: true` with a root `LICENSE` file present.
- No copyleft (GPL/LGPL/MPL), network-copyleft (AGPL/SSPL), or
  proprietary/restrictive (BUSL/Elastic) dependency was surfaced. The
  zero/near-zero dependency graph means license-contamination risk is minimal.
- No vendored third-party code without attribution was observed.
- License-tier distribution (direct deps): **Permissive: ~all** (MIT/Apache/ISC
  ecosystem); Weak/Strong/Network copyleft: **0**; Unknown: **0** in the
  published graph. _(Recommend a real scanner — `license-checker` / ScanCode —
  as a v2 confirmation across the full transitive tree.)_

## OWASP Top 10 (2021) Walkthrough

| #   | Category                           | Status           | Note                                                                                                                                                                                          |
| --- | ---------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control              | **N/A**          | No auth/authz surface in published packages; Discord enforces command access for the bot. No IDOR surface (no per-object data store).                                                         |
| A02 | Cryptographic Failures             | **Low / Info**   | No secrets at rest in repo; tokens env-only. Default RNG is `Math.random` (non-crypto) — fine for entertainment dice; see S-2. No password/crypto storage.                                    |
| A03 | Injection                          | **Not observed** | No SQL, no shell/`exec`, no `eval`/`Function`, no unsafe deserialization. Untrusted notation is parsed by bounded regex + validators, never interpolated into a sink.                         |
| A04 | Insecure Design                    | **Strong**       | Threat model for the real risk (hostile parse input) is addressed by design: regex hygiene + hard caps (`MAX_QUANTITY`, `MAX_SIDES`, repeat/reroll/explosion limits). Fail-closed env config. |
| A05 | Security Misconfiguration          | **Low**          | Render `sync:false` secrets, gitignored `.env`, SHA-pinned Actions, least-priv `permissions: contents: read` on the security workflow. Residual: no commit-time secret scanner (S-1).         |
| A06 | Vulnerable & Outdated Components   | **Strong**       | Zero-dep core; `bun audit` high-gate clean; 5 moderate/low dev-only advisories documented & suppressed in `osv-scanner.toml`; Dependabot active.                                              |
| A07 | Identification & Auth Failures     | **N/A**          | No login/session/credential system. Bot token handled correctly (env, fail-closed).                                                                                                           |
| A08 | Software & Data Integrity Failures | **Strong**       | Actions SHA-pinned; `bun install --frozen-lockfile` in CI/Render; `bun publish` discipline (resolves `workspace:~`); scoped Render build subtree. No untrusted CI plugin auto-update.         |
| A09 | Security Logging & Monitoring      | **Adequate**     | Bot has structured logging + metrics + a Sentry seam (`errorTracker.ts`, DSN-gated). Library logs nothing (correct). For a no-PII compute service this is sufficient.                         |
| A10 | Server-Side Request Forgery        | **N/A**          | No outbound request construction from user input. Bot only talks to the Discord gateway; sites are static.                                                                                    |

## Metrics

| Metric                                                       | Value                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Suspected committed secrets                                  | **0**                                                                             |
| `bun audit` high/critical                                    | **0**                                                                             |
| `bun audit` moderate / low (dev/build-time only, suppressed) | **4 / 1**                                                                         |
| Findings per OWASP category (Low+)                           | A02:1, A05:1 (both Low)                                                           |
| Dependency manifests with stale-major risk                   | **0** (zero-dep core; discord.js on current major)                                |
| Auth scheme                                                  | None (library) / Discord gateway token (bot)                                      |
| License risk distribution                                    | Permissive: all; Weak/Strong/Network copyleft: 0; Unknown: 0 (in published graph) |
| Root license present                                         | **Yes** (MIT; root pkg `private`)                                                 |
| GitHub Actions pinned to SHA                                 | **Yes — all**                                                                     |

## Recommendations

**Now (low effort, high value)**

1. **Add a commit-time secret scanner** — wire gitleaks or detect-secrets into
   `lefthook.yml` pre-commit (and/or enable GitHub push protection). The repo is
   clean today; this is pure prevention. _(S-1, CWE-798.)_

**Next**

2. **Document the RNG security boundary** — add a one-line note in
   `@randsum/roller` docs/README that the default `Math.random` is non-cryptographic
   and entertainment-grade, and show the `{ randomFn }` injection pattern for
   any consumer needing CSPRNG output. _(S-2, CWE-338.)_
3. **Run a real SCA + license tool as v2 confirmation** — this report is
   manifest-level hypothesis. Confirm with a full-tree scanner (Trivy/Snyk for
   CVEs; `license-checker`/ScanCode/FOSSA for licenses) to upgrade these
   hypotheses to confirmations, especially across the Astro/Expo transitive
   trees where the suppressed advisories live.

**Later**

4. **Re-evaluate the suppressed advisories on the next Astro/Expo major bump**
   (already flagged as `security R1` in `osv-scanner.toml`) — the suppressions
   are correct now but should expire, not become permanent.
5. **Consider a basic per-user/-guild rate limit** on the Discord bot's compute
   commands. The roller caps a _single_ roll's work, but a flood of large-but-
   legal rolls (e.g. `10000d1000000`) could still pressure the single worker
   instance. Low priority given the entertainment context and Discord's own
   interaction rate limits, but a defense-in-depth note for the
   `numInstances: 1` worker.
