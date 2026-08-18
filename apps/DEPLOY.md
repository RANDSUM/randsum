# Operations Runbook — Deploy, Rollback & DR

_Last verified against source: 2026-07-07. Covers all deployable apps in this monorepo._

This is the operational counterpart to each app's `CLAUDE.md` (which covers development).
It documents how each surface is hosted, deployed, rolled back, and recovered, plus where
to file incident RCAs.

## Surface map

| Surface            | App                                             | Host                | Trigger                  | URL                   |
| ------------------ | ----------------------------------------------- | ------------------- | ------------------------ | --------------------- |
| Docs site          | `apps/site`                                     | **Cloudflare**      | push to `main`           | randsum.dev           |
| Notation spec site | `apps/rdn`                                      | **Cloudflare**      | push to `main`           | notation.randsum.dev  |
| Discord bot        | `apps/discord-bot`                              | **Cloudflare**      | push to `main`           | bot.randsum.dev       |
| npm packages       | `packages/roller`, `packages/games`, `apps/cli` | npm registry        | changesets on merge      | npmjs.com/org/randsum |

**Everything migrated to Cloudflare on 2026-08-18** — both sites and the Discord
bot. DNS for `randsum.dev` is on Cloudflare (nameservers
`davina`/`rajeev`.ns.cloudflare.com, registrar still Hover), and all three
surfaces serve from Workers with custom domains. `/api/roll` runs as a Worker
route on the apex.

> **Netlify has been removed from the repo entirely** — the adapter, both
> `netlify.toml` files, and the `@astrojs/netlify` dependency. Nothing here
> targets it, and the Astro build has exactly one adapter again. Removing it
> also dropped ~390 transitive packages and closed the `extract-zip` advisory
> (GHSA-jmr9-qjv8-65gv), which was suppressed only because it was unreachable
> any other way.

> Config sources: `apps/site/wrangler.jsonc`, `apps/rdn/wrangler.jsonc`,
> `apps/discord-bot/wrangler.jsonc`, and `render.yaml` (repo root, dormant).
> Deployment runs from `.github/workflows/deploy-cloudflare.yml`.
>
> The `randsum.io` playground is a **legacy app deployed outside this monorepo** — it is not
> built or deployed by any config here and is out of scope for this runbook.

---

## Cloudflare cutover — the four manual steps

> **Status: done — all three surfaces serve from Cloudflare as of 2026-08-18.**
> Both sites and the Discord bot were cut over on the same day. The steps below
> are kept as the record of how it was done and how to verify it, not as
> outstanding work.
>
> **Netlify is gone from the repo.** The adapter, both `netlify.toml` files and
> the dependency were removed once the decision to leave was final, so there is
> no longer a Netlify build to fall back to — reverting a site now means
> reverting that removal, not flipping a switch. That is a deliberate trade:
> carrying a second adapter indefinitely has its own cost, and the sites had
> already been serving from Cloudflare and verified.
>
> **The Render worker still exists**, dormant. It is the bot's fallback.
>
> One thing genuinely does remain: `CLOUDFLARE_API_TOKEN` is **not** set as a
> repository secret, so `deploy-cloudflare.yml` skips every job and merges to
> `main` do not actually deploy. Until it is set, deploys are manual
> (`wrangler deploy`). Prefer a token scoped to `Workers Scripts:Edit` +
> `Workers Routes:Edit` + `Account Settings:Read` over an account-wide key.

### 1. Register a workers.dev subdomain · ~1 min

Both Workers exist but have **no URL at all**, so nothing can be smoke-tested.
There is no CLI flag for this — `wrangler --help` has none, and `wrangler deploy`
falls back to declining the prompt in any non-interactive shell.

<https://dash.cloudflare.com/f5f08e7e86ab8c183e381d4504bf8ba5/workers/onboarding>

```bash
wrangler deploy -c apps/rdn/wrangler.jsonc   # should now print a *.workers.dev URL
curl -sSo /dev/null -w '%{http_code}\n' https://randsum-rdn.<subdomain>.workers.dev/
```

### 2. Add `CLOUDFLARE_API_TOKEN` · ~2 min

Cloudflare dashboard → My Profile → API Tokens → Create Token. It needs
**`Workers Scripts: Edit`** (add `Workers KV: Edit` if the site's session KV is
ever used). Then:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo RANDSUM/randsum
```

Until this exists the deploy workflow **skips with a notice rather than failing**,
so main stays green either way. Adding it switches deploys on with no code
change.

```bash
gh run list --repo RANDSUM/randsum --workflow deploy-cloudflare.yml --limit 1
```

### 3. Add `randsum.dev` as a Cloudflare zone

Needs zone-write, which the CLI token does not carry. This is what unlocks custom
domains for the Workers *and* apex CNAME flattening.

### 4. Cut DNS over · smaller than it looks

The generic advice for this step is to lower TTLs days ahead, hunt for email
records, and disable DNSSEC before touching nameservers. **Audited on
2026-08-18, three of those four do not apply to this zone.**

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `randsum.dev` | A | `18.208.88.157`, `98.84.224.111` | 120 |
| `www.randsum.dev` | A | same pair | 120 |
| `notation.randsum.dev` | A | same pair | 120 |
| `playground.randsum.dev` | A | same pair | 120 |

> `playground` is listed here because it **was** in the zone — it was missed at
> migration time and is the subject of the correction below. It pointed at a
> Netlify project that had already been returning 404, and is being retired
> rather than recreated.

Both IPs are Netlify's shared load balancers, so all three names are really "point
at Netlify" and all three get replaced wholesale.

Confirmed **absent**: `MX`, `TXT` (so no SPF/DKIM/DMARC and no verification
records), `CAA`, `DS` (DNSSEC is **not** enabled), `_acme-challenge`, `_dmarc`,
and any wildcard. There are no CNAMEs at all, which is what Cloudflare's
auto-scan is worst at.

What that removes:

- **No TTL lowering.** Already 120s — propagation is two minutes, not two days.
- **No DNSSEC dance.** Nothing to disable, no DS TTL to wait out.
- **No email risk.** There is no mail on this domain to break.

What still stands:

- **Verify grey-cloud before proxying.** Confirm all three names resolve
  correctly with nothing proxied, then flip.
- **Keep the Netlify DNS zone for at least two weeks.** While it exists,
  rollback is one nameserver change at the registrar; once deleted it is a
  rebuild. (Still true as of writing — the zone was queried directly during the
  post-cutover re-check below, so it is demonstrably still there.)
- **Do it with someone watching.** Short TTLs make a mistake quick to *undo*,
  not impossible to *make*.

> ⚠️ **This inventory was a probe, not a zone dump, and the first probe was
> WRONG.** It was built with `dig` against the names above plus the usual
> suspects, because enumerating a zone requires AXFR (refused) or the Netlify DNS
> dashboard.
>
> **It missed `playground.randsum.dev`.** That name had the same Netlify A-record
> pair as the other three, was not on the guessed list, and was therefore not
> replicated into the Cloudflare zone — so it went from resolving to NXDOMAIN at
> the nameserver flip, and this file previously claimed the replication had been
> complete. It had not.
>
> **What was actually lost: nothing that worked.** `playground.randsum.dev`
> already returned **404** before the migration — verified by requesting it
> directly against the Netlify load balancer with a `Host` header, and by its
> `randsum-playground` project 404ing on its own `netlify.app` URL too. So the
> real change is 404 → NXDOMAIN on a hostname that had been dead for some time.
> It is being **retired deliberately** rather than restored: pointing DNS back at
> a dead project would restore a 404, and the Netlify project is being deleted.
>
> **Re-enumerated properly afterwards.** ~120 candidate names — every Netlify
> project hostname, every name appearing anywhere in this repo, and a long
> generic list — queried against the still-authoritative NS1 zone for A, CNAME
> and TXT. The zone contains exactly four names: the apex, `www`, `notation` and
> `playground`. No MX, TXT, CAA or SRV anywhere.
>
> **The lesson is the one this warning already stated and the next reader should
> not have to relearn:** a guessed-name probe cannot prove a zone is complete,
> only that the names you thought of are present. Enumerate from an authoritative
> source — here, the host's own project list would have surfaced `playground`
> immediately, since it was a custom domain on a project in the same account.

### Only then: decommission

**Netlify: done in the repo, pending in the account.** Nothing here builds for
Netlify any more, so the remaining work is on Netlify's side — otherwise its git
integration keeps building this repo on every PR, producing deploys nobody reads.

The account holds **four** projects, across two teams, and only the first two
are built from this repo:

| Project | Serves | Team | State |
| --- | --- | --- | --- |
| `randsum-site` | randsum.dev | dev | live deploy, no longer receives traffic |
| `rdn-spec` | notation.randsum.dev | dev | live deploy, no longer receives traffic |
| `randsum-playground` | playground.randsum.dev | pro | **404s on its own URL**; DNS now retired |
| `randsumweb` | randsum.io | pro | last deployed 2024; `randsum.io` now answers from Cloudflare, not here |

The last two are **not** built by this repo and predate the migration — they are
listed so that "delete the Netlify projects" does not quietly mean "delete two of
four and leave two behind."

`randsum.io` in particular needs a decision rather than a deletion: it currently
serves a `randsum-expo` page from Cloudflare with DNS at Hover, so the Netlify
project behind it is already bypassed.

**Render: not yet, deliberately.** The Render worker is the bot's only fallback:

| To revert | Do this | Time |
| --- | --- | --- |
| The bot | Clear the Interactions Endpoint URL in the Discord app | instant |

Delete Render only after the bot has been observed handling real traffic across
a busy period.

**The bot's rollback has a shelf life.** Clearing the endpoint URL restores
gateway delivery only while a gateway process is actually running. Once the
Render service is deleted, that fallback is gone and reverting means
redeploying the worker first — which is fine, but it is a different-sized
operation than clearing a field, so do not delete Render believing the one-field
revert still exists.

Sentry needs no decommissioning: it was never enabled in production, and the
Worker does not import the error tracker at all. Alerting for the gateway bot
ran through a Discord webhook and a Healthchecks heartbeat (see
`apps/discord-bot/CLAUDE.md`); **the Worker inherits neither.** Cloudflare
Workers Observability is enabled in `wrangler.jsonc` and is now the only place
bot errors are visible — worth knowing before wondering why the heartbeat went
quiet.

## Cloudflare (apps/site → randsum.dev, apps/rdn → notation.randsum.dev)

Both Astro sites are separate Workers, each with a custom domain, deployed from
`.github/workflows/deploy-cloudflare.yml` on merge to `main`.

- **site** — needs a Worker, not just assets: `src/pages/api/roll.ts` sets
  `prerender = false`, so one route is server-rendered and everything else ships
  as static assets. Built via `@astrojs/cloudflare` with
  `prerenderEnvironment: 'node'`; deploy the **adapter-generated**
  `apps/site/dist/server/wrangler.json`, not the hand-written
  `apps/site/wrangler.jsonc` (that one is build input).
- **rdn** — `output: 'static'`, no adapter. Deploy `apps/rdn/wrangler.jsonc`.
- Both are path-filtered, so a merge only redeploys what it touched.

### Deploy

Merge to `main`. To deploy by hand, or when `CLOUDFLARE_API_TOKEN` is unset and
CI is skipping:

```bash
bun run --filter '@randsum/roller' build
bun run --filter '@randsum/games' build
DEPLOY_TARGET=cloudflare bun run site:build
wrangler deploy -c apps/site/dist/server/wrangler.json

bun run --filter @randsum/roller --filter @randsum/rdn build
wrangler deploy -c apps/rdn/wrangler.jsonc
```

### Rollback — roll back to a previous version

Workers keeps every uploaded version, so rollback needs no rebuild:

```bash
wrangler deployments list --name randsum-site
wrangler rollback --name randsum-site [<version-id>]
```

Same shape for `randsum-rdn` and `randsum-discord-bot`. This is atomic and
reversible — rolling back does not delete newer versions.

> **`wrangler rollback` restores code, not configuration.** Custom domains,
> routes and vars live on the Worker rather than in the version, so a rollback
> will not undo a bad `routes` change. Fix that by deploying a corrected config.

### DR notes

- Both sites are fully reproducible from git; loss of Cloudflare state is
  recoverable by re-running the deploy commands above.
- The non-git state is **DNS and the zone**: `randsum.dev` is on Cloudflare
  nameservers with the registrar still at Hover. Keep the registrar credentials
  and the Cloudflare account documented in the password vault. The zone holds
  only three proxied records, all pointing at Workers custom domains.
- **A trailing-slash redirect returns 307, not 301**, because Workers Static
  Assets hardcodes it and `html_handling` cannot change it. This is not a
  regression to chase: pages emit `<link rel="canonical">` and the sitemap uses
  the trailing-slash form, so the canonical URL is declared explicitly. The
  site's own legacy redirects are still 301 — they come from Astro's route
  manifest, a different mechanism.

---

## Render (apps/discord-bot)

`render.yaml` (repo root) declares the bot as a Render **worker** service
(`randsum-discord-bot`): build `bun install && bun run build`, start
`node apps/discord-bot/dist/index.js`. Env vars `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`,
`DISCORD_GUILD_ID` are `sync: false` (set in the Render dashboard, never committed).

### Deploy

Render auto-deploys the worker on push to `main` (per the blueprint). The bot's **slash
commands** are reconciled by the worker itself on startup: after login it compares its command
barrel against Discord's registered set and writes only when they differ, logging
`commands.sync.unchanged` / `commands.sync.updated` / `commands.sync.failed`. Deploying is
therefore sufficient — there is no separate registration step to remember.

(Remove `DISCORD_GUILD_ID` to register globally — ~1h propagation; set it for instant
per-guild registration during development.)

`SENTRY_DSN` is a fourth `sync: false` env var and is **optional** — the tracker logs but does
not report when it is unset, and the worker logs which mode it is in at boot
(`errorTracker.init … enabled: true|false`). Set it in the Render dashboard to get exception
reporting; check that boot line before concluding anything from an empty Sentry project.

> Reporting was a no-op stub until #1211: `SENTRY_DSN` was read and logged as `enabled: true`,
> but the forwarder had an empty body, so no event was ever sent. Any "nothing in Sentry"
> observation from before that commit carries no information.

> This used to be a manual `bun run deploy-commands`. It was forgotten after #1191 renamed
> `/su` to `/salvageunion`, leaving Discord advertising a command the worker no longer had;
> every invocation silently timed out for a week while the bot was healthy. The startup sync
> exists so that failure mode cannot recur.

```bash
# Escape hatch: force a registration write without restarting the worker
cd apps/discord-bot
bun run deploy-commands   # needs DISCORD_TOKEN + DISCORD_CLIENT_ID in the environment
```

### Triage — "the bot is down"

A worker has no inbound URL, so there is nothing to `curl`. Work the signals in this order;
the first two need no Render access at all.

1. **Did the last deploy succeed?** Render reports every deploy to GitHub, so deploy health is
   readable without logging in:

   ```bash
   gh api "repos/RANDSUM/randsum/deployments?environment=main%20-%20randsum-discord-bot&per_page=5" \
     --jq '.[] | "\(.id) \(.created_at) \(.sha[0:8])"'
   gh api repos/RANDSUM/randsum/deployments/<id>/statuses \
     --jq '.[] | "\(.created_at) \(.state) \(.log_url)"'
   ```

   A `success` state means the build ran and the process started. **A successful deploy followed
   by a dead bot means a runtime failure, not a build failure** — skip straight to step 3.

2. **Is it actually the bot?** The other surfaces fail independently and are directly probeable:
   `curl -sSo /dev/null -w '%{http_code}' https://randsum.dev` (and `notation.randsum.dev`), plus
   `curl -sS https://registry.npmjs.org/@randsum/roller/latest` for the packages. "Randsum is
   down" is most often only one of these four.

3. **Check the heartbeat first — it answers "is it connected?" directly.** Every
   `metrics.flush` line (one per 5 minutes) embeds the gateway snapshot:

   ```
   "gateway":{"status":"ready","connected":true,"forMs":812344,"disconnects":0,"resumes":0}
   ```

   Grep the logs for `'"connected":false'`. A hit is an outage, with `status` and `forMs`
   saying which kind and for how long. **This is the fastest signal available and it should be
   your first look** — it needs no correlation across lines.

4. **Read the boot sequence.** Render dashboard → `randsum-discord-bot` → **Logs**, or the
   `render` MCP server (`.mcp.json`). One JSON line per lifecycle event:
   `errorTracker.init` → `bot.connecting` → `gateway.connecting` → `bot.login_succeeded`
   (with `elapsedMs`) → `gateway.ready` → `commands.sync.*` → `bot.ready`. Where it stops tells
   you which failure this is:

   | Last line seen                      | Meaning                                                       |
   | ----------------------------------- | ------------------------------------------------------------- |
   | `login.retry` ×5 then `login.failed`| Bad/revoked `DISCORD_TOKEN` → exit 1 → Render restart loop. Rotate the token (below). |
   | `bot.connecting` then nothing       | `client.login()` is hung — **not** a rejection, so `loginWithBackoff` never fires. Usually Discord throttling session starts. `gateway.stalled` fires after 5 min. |
   | `gateway.disconnected` / `gateway.reconnecting` | WebSocket dropped. Process is alive and Render shows green; the bot is offline in Discord. |
   | `bot.ready`, then silence           | Connected and healthy; the problem is command registration or a specific command. |
   | `commands.sync.failed`              | Registry desync only. The bot still serves its previous command list. |
   | nothing at all                      | Service suspended, or the deploy never started. Check Render **Events**. |

   Note the login path is a **crash loop by design**: five backed-off attempts, then `exit(1)`
   so a persistent auth failure surfaces to the platform rather than sitting in a fake-healthy
   process. Repeated restart events in Render with `login.failed` in each is the signature.

   > **A green Render dashboard does not mean a connected bot.** Render only knows the process
   > is alive. On 2026-08-18 the bot was offline while every Render signal — build, deploy,
   > events, service status — was `succeeded`, and the logs showed nothing but identical
   > `metrics.flush` heartbeats. The gateway fields above exist so that is never again
   > indistinguishable from health; do not conclude "the bot is fine" from Render state alone.

5. **Check Sentry.** Only meaningful if the run logged `errorTracker.init … enabled: true`.
   `SENTRY_DSN` is optional and unset by default — see the caveat under *Deploy* above.

### Restart

Render dashboard → service `randsum-discord-bot` → **Manual Deploy → Restart service** (or
**Suspend** then **Resume**). A worker has no inbound URL; "up" means connected to the Discord
gateway.

### Rollback — redeploy previous commit

1. Render dashboard → `randsum-discord-bot` → **Deploys** (or **Events**) tab.
2. Find the last known-good deploy → **Redeploy** that commit (Render's "Rollback to this
   deploy" / "Redeploy" action rebuilds and restarts the worker on that commit).
3. If a command-schema change is part of the regression, the redeployed worker restores the
   prior command set on startup — the rolled-back barrel is what it syncs from. Watch for
   `commands.sync.updated` in the logs to confirm.

### Token rotation (`DISCORD_TOKEN`)

1. Discord Developer Portal → your application → **Bot** → **Reset Token**; copy the new token.
2. Render dashboard → `randsum-discord-bot` → **Environment** → update `DISCORD_TOKEN` → save.
3. Render restarts the worker with the new secret. (The restart runs the startup command sync,
   which will log `commands.sync.unchanged` — a token rotation is not a command change.)
4. Invalidate the old token: it is revoked the moment you reset it in the portal, so any
   leaked copy stops working immediately. Audit any place the old value may have leaked.
5. `DISCORD_CLIENT_ID` is the application ID, not a secret, but is also stored in Render env.

### DR notes

- The bot is reproducible from git via the Render blueprint. The only external state is the
  three env vars (set in Render) and the Discord application itself. Keep the Discord app's
  owner/team membership documented so the token can always be rotated.

---

## npm packages (roller, games, cli)

Publishing is **automated via changesets + npm OIDC Trusted Publishing** (`.github/workflows/publish.yml`):
merging a changeset to `main` opens/updates a `chore: version packages` PR, and merging that PR
publishes the changed packages. Under the hood `bun scripts/publish.ts` packs each package with
`bun pm pack` (resolving `workspace:~`) and publishes the tarball with `npm publish --provenance`,
in order `@randsum/roller` → `@randsum/games` → `@randsum/cli`. A local fallback is
`bun scripts/publish.ts --otp=<CODE>`. See root `CLAUDE.md` for the full flow and the
`workspace:~` resolution reason (never run a bare `npm publish` on the raw source tree).

### Rollback

npm does not allow republishing an overwritten version. To "roll back" a bad release:

1. `npm deprecate @randsum/<pkg>@<bad-version> "use <good-version>"` to steer consumers.
2. Publish a new patch version that reverts the change (preferred over `npm unpublish`, which
   is restricted and disruptive).

---

## Incident RCAs

File a post-incident Root Cause Analysis for any user-facing outage or data/secret incident:

- **Location:** `runbooks/incidents/`
- **Template:** copy `runbooks/RCA-template.md` to
  `runbooks/incidents/RCA-YYYY-MM-DD-<short-slug>.md` and fill it in.

One RCA per incident. Link the RCA from the related GitHub issue/PR.
