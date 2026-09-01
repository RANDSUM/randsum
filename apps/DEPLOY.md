# Operations Runbook — Deploy, Rollback & DR

_Last verified against source: 2026-09-01. Covers all deployable apps in this monorepo._

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
> `apps/discord-bot/wrangler.jsonc`. Deployment runs from
> `.github/workflows/deploy-cloudflare.yml`. There are no other deploy configs —
> Netlify and Render were both removed.
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
> **Render is gone too**, as of 2026-09-01 — and with it the gateway bot it
> hosted. The bot has exactly one transport now; see the decommission section.
>
> **`CLOUDFLARE_API_TOKEN` is set**, and CI genuinely deploys: verified by
> re-running the workflow and confirming all three jobs uploaded new versions
> rather than taking the skip path. The token is currently **account-wide**;
> narrowing it to `Workers Scripts:Edit` + `Workers Routes:Edit` +
> `Account Settings:Read` is a swap of the same repository secret.

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
change — which is exactly how it played out.

**Beware how the skip path reads in the logs.** A skipped run reports
`success`, identically to a real deploy, because the guard exits 0 on purpose.
The distinguishing signal is a `##[notice]` line; the echoed script source of
the un-taken branch also contains the words "skipping deploy", so grepping the
raw log for that string finds it either way. Check for new **version IDs**
instead — that is the only unambiguous proof a deploy happened.

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

### Decommission — done 2026-08-18

**Netlify: fully gone.** Nothing in the repo builds for it, and the account side
is cleaned up too. Builds were stopped on both repo-linked projects first — that
is what actually kills the deploy previews, since Netlify's git integration is
independent of this repo's contents and would otherwise have kept building every
PR forever — and then all four projects were deleted.

The account holds **four** projects, across two teams, and only the first two
are built from this repo:

All **four** were deleted on 2026-08-18, across two teams. The count matters:
only the first two were built from this repo, and a "delete the Netlify
projects" instruction would plausibly have left the other two behind forever.

| Project | Served | Team | Why it was safe to delete |
| --- | --- | --- | --- |
| `randsum-site` | randsum.dev | dev | superseded; Cloudflare had been serving it and was verified |
| `rdn-spec` | notation.randsum.dev | dev | same |
| `randsum-playground` | playground.randsum.dev | pro | 404'd on its own URL; DNS already retired |
| `randsumweb` | randsum.io | pro | last deployed 2024; `randsum.io` resolves to a Cloudflare anycast IP with no Netlify headers, so the project was already bypassed |

Each hostname was re-checked immediately after its project was deleted.
`randsum.io` still returns 200 and is unaffected — it serves from Cloudflare
with DNS at Hover, and nothing in this repo builds it.

**The Netlify DNS zone was NOT deleted.** It is the only remaining
nameserver-level rollback: while it exists, reverting the whole migration is one
change at the registrar. Deleting the projects did not touch it.

### Render — dropped entirely, 2026-09-01

Render was suspended on 2026-08-18 and kept as the bot's fallback. It is now
gone from both sides: the repo config below was removed, and **every Render
service was deleted from the account** (confirmed 2026-09-01). There is nothing
left to resume.

**The fallback was already worth less than it looked.** Suspending stopped the
process, so reverting was never the one-field change it sounded like: clearing
the Interactions Endpoint URL restores gateway *delivery*, but delivery only
helps if a gateway process is actually running. The revert was "resume Render,
then clear the URL" — and resuming Render only worked while Render existed.

What was removed from the repo, all in one change:

| Removed | Was |
| --- | --- |
| `render.yaml` | the worker blueprint (region, plan, `numInstances: 1`, six env vars) |
| `src/index.ts` | the discord.js gateway entry point |
| `src/events/` | `interactionCreate`, `guildCreate` — only ever wired up by `index.ts` |
| `src/utils/{gateway,heartbeat,loginWithBackoff,syncCommands,metrics}.ts` | connection lifecycle, dead-man's switch, login retry, boot-time registry sync, counters |
| `bunup.config.ts` + `build`/`start` scripts | bundling `dist/index.js` for a Node host |

`@randsum/discord-bot` is now in `BUILD_EXEMPT` in
`scripts/check-workspace-scripts.ts` — wrangler compiles the Worker entry itself,
so there is no artifact left to build. `utils/discord.ts` narrowed from the
gateway barrel to `REST`/`Routes` plus two interaction types, which is all
`deploy-commands.ts` still needs.

**Reverting to a gateway bot is now a git revert plus a new host**, not a
config change. That is the deliberate trade: the fallback had no host, no
traffic, and no test that it still worked, and a rollback nobody has exercised
is a claim rather than a plan.

**What this costs, concretely: slash-command registration is now manual.** The
gateway process reconciled the registry on every boot. Nothing replaces it — see
the bot's section below.

Alerting did not survive either, and this is the part most likely to surprise
someone later. The gateway bot's Discord webhook and Healthchecks heartbeat were
wired in `index.ts`; **the Worker inherits neither.**

`errorTracker.ts` was cut down to a structured-log seam in the same change, and
then removed entirely when `Command.execute` went — `/notation`'s gateway
handler was its last caller. Its remote forwarding, a hand-rolled Sentry
envelope sender and a Discord webhook poster with a 10-minute dedupe window, had
already gone with Render; it was configured by `SENTRY_DSN` and
`DISCORD_ERROR_WEBHOOK_URL`, both Render dashboard variables, and initialized by
the gateway's `initErrorTracker()` call. None of it could have run on workerd
regardless: it read `process.env`, and `flushErrorTracker()` existed to drain
in-flight sends before a deliberate `process.exit`, which a Worker has no concept
of.

**Cloudflare Workers Observability is the only place bot errors are visible.** It
needs nothing from the application — it captures uncaught exceptions and request
telemetry at the platform level. The Worker path never emitted an application log
line even before the removal, so there is no log stream that stopped. Re-adding
one means writing it against the Worker's `env` argument and calling it from
`dispatch.ts`.

Sentry needs no decommissioning: it was never enabled in production.

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

Merge to `main` — CI deploys automatically. To deploy by hand (or if the token
is ever removed and CI starts skipping):

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

## Cloudflare Worker — the Discord bot (apps/discord-bot → bot.randsum.dev)

The bot is `apps/discord-bot/wrangler.jsonc`, deployed by
`.github/workflows/deploy-cloudflare.yml` on merge to `main`. Discord POSTs each
interaction to `https://bot.randsum.dev/`, set as the application's Interactions
Endpoint URL.

**There is no second transport.** The discord.js gateway process and its Render
host were both removed on 2026-09-01 — `render.yaml`, `src/index.ts`,
`src/events/`, and the gateway-only utilities are gone. A skipped or broken
deploy here is a user-visible outage with nothing behind it, which is the main
thing that changed about operating this service.

- The Worker needs **no `DISCORD_TOKEN`**. HTTP interactions are authenticated by
  request signature, so the most sensitive credential is simply not deployed.
  `DISCORD_PUBLIC_KEY` is a committed `var`, not a secret — the reasoning is in
  `wrangler.jsonc`, and it verifies signatures rather than producing them.
- `bot.randsum.dev` is declared in `routes` as a `custom_domain`, so a deploy
  cannot silently detach the hostname Discord calls. Discord stores an absolute
  URL and never rediscovers it.
- The app has **no `build` script**. Wrangler compiles `src/worker/index.ts`
  itself; only `@randsum/roller` and `@randsum/games` are built first, because
  the Worker imports them through workspace subpath exports.

### Deploy

Merge to `main`. To deploy by hand:

```bash
bun run --filter '@randsum/roller' --filter '@randsum/games' build
bunx wrangler@4 deploy -c apps/discord-bot/wrangler.jsonc
```

### Triage — "the bot is down"

Unlike the gateway process, this endpoint is directly probeable — which removes
most of the old triage. A signed request is required for a 200, but an unsigned
POST proves the Worker is running and rejecting correctly:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://bot.randsum.dev/ \
  -H 'content-type: application/json' -d '{"type":1}'
```

| Response | Meaning |
| --- | --- |
| `401` | **Healthy.** The Worker is up and refusing an unsigned request, which is exactly what Discord's own endpoint validation checks. |
| `405` | Healthy, but you sent a GET — only POST is handled. |
| `530` / `522` | The route or custom domain is detached. Redeploy with the config above; do not chase it in Discord's settings. |
| timeout / `5xx` | Worker exception. Read the logs. |

```bash
bunx wrangler@4 tail --name randsum-discord-bot          # live
```

Observability is enabled in `wrangler.jsonc`, so Workers Logs in the dashboard
is the durable view. **It is the only place bot errors surface** — the Discord
webhook alerting and Healthchecks heartbeat belonged to the gateway process and
did not come along.

If the endpoint is healthy but a command misbehaves, it is a registry problem,
not a transport one — see the next section.

### Slash command registration is now a manual step

The gateway process reconciled the command registry on every boot. Nothing in
the Worker path does, so **adding, renaming, or removing a command requires an
explicit write**:

```bash
cd apps/discord-bot
bun run deploy-commands   # needs DISCORD_TOKEN + DISCORD_CLIENT_ID in the environment
```

This is the one operational regression from dropping the gateway, and it has bitten
before: #1191 renamed `/su` to `/salvageunion` without a registration write, and
every invocation timed out for a week while the bot was healthy. A stale registry
is invisible from the endpoint probe above.

(Set `DISCORD_GUILD_ID` for instant per-guild registration while developing; leave
it unset for global registration, ~1h propagation.)

### Rollback

```bash
bunx wrangler@4 deployments list --name randsum-discord-bot
bunx wrangler@4 rollback --name randsum-discord-bot [<version-id>]
```

Atomic, no rebuild, and newer versions are not deleted. As with the sites,
**rollback restores code, not configuration** — routes and vars live on the
Worker, so a bad `routes` change is fixed by deploying a corrected config.

A rolled-back command *schema* does not roll back the registry: re-run
`deploy-commands` from the rolled-back checkout.

### Token rotation (`DISCORD_TOKEN`)

The Worker does not hold this token, so rotation is no longer a deploy concern —
it only affects whoever runs `deploy-commands`.

1. Discord Developer Portal → application → **Bot** → **Reset Token**.
2. Use the new value in the environment you run `deploy-commands` from.

Resetting revokes the old token immediately. `DISCORD_CLIENT_ID` is the
application ID, not a secret.

### DR notes

- Fully reproducible from git: `wrangler deploy` from a clean checkout is
  complete, because `DISCORD_PUBLIC_KEY` is committed rather than a Worker secret.
- The non-git state is the **Discord application** itself — the Interactions
  Endpoint URL and the registered command list. Keep the application's owner/team
  membership documented so the token can always be rotated.
- Losing `bot.randsum.dev` (zone or custom domain) takes the bot down with no
  failing deploy to point at, since Discord never rediscovers the URL.

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
