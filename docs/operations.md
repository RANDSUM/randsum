# Operations Runbook — Deploy, Rollback & DR

_Last verified against source: 2026-10-30. Covers all deployable apps in this monorepo._

This is the operational counterpart to each app's `CLAUDE.md` (which covers development).
It documents how each surface is hosted, deployed, rolled back, and recovered.

## Surface map

| Surface            | App                                             | Host                | Trigger                  | URL                   |
| ------------------ | ----------------------------------------------- | ------------------- | ------------------------ | --------------------- |
| Docs site + spec   | `apps/site`                                     | **Cloudflare**      | green CI on `main`       | randsum.dev           |
| Old spec host      | `apps/site` (`wrangler.notation.jsonc`, 301 only) | **Cloudflare**      | green CI on `main`       | notation.randsum.dev  |
| Discord bot        | `apps/discord-bot`                              | **Cloudflare**      | green CI on `main`       | bot.randsum.dev       |
| npm packages       | `packages/roller`, `packages/games`, `packages/mcp` | npm registry        | changesets on merge      | npmjs.com/org/randsum |

DNS for `randsum.dev` is on Cloudflare (nameservers
`davina`/`rajeev`.ns.cloudflare.com; registrar moving from Hover to Cloudflare
Registrar, transfer started 2026-10-30), and all three
surfaces serve from Workers with custom domains. `/api/roll` runs as a Worker
route on the apex.

> Config sources: `apps/site/wrangler.jsonc`, `apps/site/wrangler.notation.jsonc`
> (the `notation.randsum.dev` 301s, deployed to the `randsum-rdn` Worker) and
> `apps/discord-bot/wrangler.jsonc`. Deployment runs from
> `.github/workflows/deploy-cloudflare.yml`. There are no other deploy configs.
>
> **randsum.dev is the only front page.** `randsum.io` and `www.randsum.io` 301 to
> `https://randsum.dev` through a Redirect Rule in the `randsum.io` zone (set 2026-10-30;
> randsum.io no longer points at the deleted Expo app's hosting, #1121). The site Worker
> sets `workers_dev: false` and `preview_urls: false`, so it has no `*.workers.dev` copy.
> `www.randsum.dev` must 301 to the apex through a Redirect Rule in the `randsum.dev` zone,
> because static assets answer before the Worker and cannot redirect by hostname.

---

## History

Every surface moved to Cloudflare on 2026-08-18, and Netlify and Render were removed
from the repo and their accounts by 2026-09-01. How that was done, including the DNS
audit and the decommission, is in the PRs that did it: #1226 through #1236.

## Cloudflare (apps/site → randsum.dev)

The Astro site is a Worker with a custom domain, deployed from
`.github/workflows/deploy-cloudflare.yml` once CI is green on `main`. It also
serves the notation spec at `/spec` and its conformance vectors at
`/conformance/`.

- **site** — `output: 'static'`, no adapter, plus one hand-written Worker
  (`apps/site/worker/index.ts`) for `/api/roll`. `assets.run_worker_first`
  sends only `/api/*` to it; everything else is served from assets. Legacy
  301s live in `apps/site/public/_redirects`. Deploy `apps/site/wrangler.jsonc`.
- The trigger is `workflow_run` on CI: nothing deploys unless CI concluded
  `success` for a push to `main`, and the jobs check out the commit CI tested.
  The `plan` job diffs that commit against the commit the last successful
  CI-triggered deploy shipped, so a deploy the concurrency group cancelled has
  its changes carried by the next one; a change to any of
  `apps/{site,discord-bot}/**`, `packages/**` or `bun.lock` runs both deploy
  jobs. Each run records its commit in its run name (`Deploy <sha>`), and
  `plan` reads it back from there. If the commit is *older* than the last
  deployed one — a CI re-run on an earlier `main` commit — `plan` deploys
  nothing and says so in a notice, rather than roll every surface and the
  command registry back. That refused run still concludes success under its
  older title, so `plan` reads the last 50 successful runs and picks the newest
  commit by ancestry, skipping any recorded commit that a later one descends
  from. Only when there is no earlier deploy in that window, or it is on an
  unrelated history, does `plan` deploy everything. To roll back on purpose, use
  the rollback commands below. Redeploying an unchanged surface is a no-op
  version upload, so this costs CI minutes rather than correctness. A manual run
  can narrow to one surface — see below.
- Without the `CLOUDFLARE_API_TOKEN` repository secret every deploy job **fails
  red** with an `::error::` line: there is no second host, so a missing or
  renamed secret must not read as green. New **version IDs** in the deploy log
  are the proof a deploy happened.

### Deploy

Merge to `main` — the deploy runs once CI is green. To deploy by hand:

```bash
bun run --filter '@randsum/roller' build
bun run --filter '@randsum/games' build
bun run site:build
bun run --filter @randsum/site deploy
bun run --filter @randsum/site deploy:notation   # notation.randsum.dev 301s
```

### notation.randsum.dev — redirect only

The spec moved into `apps/site` at `/spec`. `notation.randsum.dev` must keep
answering with a 301, because the spec (v0.9.0, section "Document
Information") and every conformance file's `$id` name it. The redirect is code:
`apps/site/worker/notation-redirect.ts`, deployed by the site job from
`apps/site/wrangler.notation.jsonc` right after the site itself.

| Path on notation.randsum.dev | 301 to |
| --- | --- |
| `/conformance/*` | `https://randsum.dev/conformance/*` (the `$id` path is kept) |
| `/robots.txt`, `/favicon.ico`, `/sitemap-index.xml`, `/sitemap-0.xml` | the same file on `https://randsum.dev` |
| anything else | `https://randsum.dev/spec<path>` |

The query string is kept on every redirect, and `apps/site/__tests__/notation-redirect.test.ts`
pins the table.

The config deploys to the **existing `randsum-rdn` Worker**, the one that
served the old rdn site. Its `notation.randsum.dev` Custom Domain lives on that
Worker rather than in any config file, so a new script under the same name
keeps the hostname and its DNS record. Do not delete the `randsum-rdn` Worker
and do not detach its custom domain: that is what keeps the redirect reachable.

Both of these must print a 301 with the shown `location`:

```bash
curl -sI https://notation.randsum.dev/v/0.9.0/ | grep -i -E '^(HTTP|location)'                 # 301 → https://randsum.dev/spec/v/0.9.0/
curl -sI https://notation.randsum.dev/conformance/v0.9.0.json | grep -i -E '^(HTTP|location)'  # 301 → https://randsum.dev/conformance/v0.9.0.json
```

### Deploying when no deploy ran

**A merge to `main` is not a guarantee that anything deployed.** On 2026-09-01
the merge of #1235 produced ZERO workflow runs — not the deploy, not CI, not
CodeQL. `actions/runs?head_sha=<sha>` returned `total_count: 0` twenty minutes
later. GitHub dropped the push event; the workflow was correct and had run
normally for the merge forty minutes before. With no CI run there is no
`workflow_run` either, and a red CI run deploys nothing by design.

There is no re-run for a run that never existed, so `workflow_dispatch` is the
way out. A manual run deploys main as it stands, without the CI gate, so check
main is green first:

```bash
gh workflow run deploy-cloudflare.yml --ref main                    # all surfaces
gh workflow run deploy-cloudflare.yml --ref main -f surface=bot     # just the bot
gh workflow run deploy-cloudflare.yml --ref main -f surface=site    # randsum.dev
```

Or use the **Run workflow** button on the workflow's Actions page. It shares the
`deploy-cloudflare` concurrency group with the CI-triggered runs, so a manual
run queues behind an in-flight deploy rather than racing it.

**Confirm a merge actually deployed** — a green PR says nothing about the push
that followed it:

```bash
gh api "repos/RANDSUM/randsum/actions/runs?head_sha=$(git rev-parse origin/main)" --jq '.total_count'
```

`0` means no workflow ran for that commit at all. Dispatch manually. A CI run with
no deploy run after it means CI was red, or `plan` found nothing to deploy.

### Rollback — roll back to a previous version

Workers keeps every uploaded version, so rollback needs no rebuild:

```bash
bun run --cwd apps/site wrangler deployments list --name randsum-site
bun run --cwd apps/site wrangler rollback --name randsum-site [<version-id>]
```

Same shape for `randsum-discord-bot`. This is atomic and
reversible — rolling back does not delete newer versions.

> **`wrangler rollback` restores code, not configuration.** Custom domains,
> routes and vars live on the Worker rather than in the version, so a rollback
> will not undo a bad `routes` change. Fix that by deploying a corrected config.

### DR notes

- The site is fully reproducible from source; loss of Cloudflare state is
  recoverable by re-running the deploy commands above. That includes the
  `notation.randsum.dev` redirect (`bun run --filter @randsum/site
  deploy:notation`); if the `randsum-rdn` Worker itself is
  lost, re-add `notation.randsum.dev` as its Custom Domain after deploying.
- The non-git state is **DNS and the zones**: `randsum.dev` and `randsum.io`
  are on Cloudflare nameservers, with both registrations moving from Hover to
  Cloudflare Registrar (started 2026-10-30). The `randsum.io` zone holds only
  its redirect rule. Keep the registrar credentials
  and the Cloudflare account documented in the password vault. The zone holds
  four proxied names — the apex, `www`, `notation` (the redirect Worker) and
  `bot` — all pointing at Workers custom domains.
- The old Netlify DNS zones (`randsum.dev`, `randsum.io`) were deleted on
  2026-10-30. Nothing RANDSUM-related is left on Netlify.
- **Owner action outstanding:** finish the Hover → Cloudflare Registrar
  transfers for `randsum.dev` and `randsum.io`, then close the Hover account.
- **A trailing-slash redirect returns 307, not 301**, because Workers Static
  Assets hardcodes it and `html_handling` cannot change it. This is not a
  regression to chase: pages emit `<link rel="canonical">` and the sitemap uses
  the trailing-slash form, so the canonical URL is declared explicitly. The
  site's own legacy redirects are still 301 — they come from
  `apps/site/public/_redirects` (Workers Static Assets `_redirects` rules), a
  different mechanism from the hardcoded trailing-slash 307.

---

## Cloudflare Worker — the Discord bot (apps/discord-bot → bot.randsum.dev)

The bot is `apps/discord-bot/wrangler.jsonc`, deployed by
`.github/workflows/deploy-cloudflare.yml` once CI is green on `main`. Discord POSTs each
interaction to `https://bot.randsum.dev/`, set as the application's Interactions
Endpoint URL.

**There is no second transport.** The discord.js gateway process and its Render
host were both removed on 2026-09-01 — `render.yaml`, `src/index.ts`,
`src/events/`, and the gateway-only utilities are gone. A skipped or broken
deploy here is a user-visible outage with nothing behind it, which is the main
thing that changed about operating this service.

- The Worker needs **no `DISCORD_TOKEN`**. HTTP interactions are authenticated by
  request signature, so the most sensitive credential is simply not deployed. The
  token lives only in the `DISCORD_TOKEN` repository secret, for command
  registration.
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
bun run --filter @randsum/discord-bot deploy
bun run --filter @randsum/discord-bot deploy-commands   # if a command changed
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
bun run --cwd apps/discord-bot wrangler tail --name randsum-discord-bot   # live
```

Observability is enabled in `wrangler.jsonc`, so Workers Logs in the dashboard
is the durable view. **It is the only place bot errors surface** — the Discord
webhook alerting and Healthchecks heartbeat belonged to the gateway process and
did not come along.

If the endpoint is healthy but a command misbehaves, it is a registry problem,
not a transport one — see the next section.

### Slash command registration

The gateway process reconciled the command registry on every boot; the Worker
never writes it. The bot deploy job does instead: after the Worker deploy it runs
`deploy-commands`, one idempotent bulk-overwrite PUT of the whole barrel, whenever
`src/commands/**` or `deploy-commands.ts` changed since the last successful
deploy, and on every manual bot deploy.
It fails red if the `DISCORD_TOKEN` secret is missing.

That closes the gap behind #1191, which renamed `/su` to `/salvageunion` without a
registration write: every invocation timed out for a week while the bot was
healthy. A stale registry is invisible from the endpoint probe above, so if one is
suspected, repair it with `gh workflow run deploy-cloudflare.yml --ref main -f surface=bot`.

(Run `bun run deploy-commands` locally with `DISCORD_GUILD_ID` set for instant
per-guild registration while developing.)

### Rollback

```bash
bun run --cwd apps/discord-bot wrangler deployments list --name randsum-discord-bot
bun run --cwd apps/discord-bot wrangler rollback --name randsum-discord-bot [<version-id>]
```

Atomic, no rebuild, and newer versions are not deleted. As with the site,
**rollback restores code, not configuration** — routes and vars live on the
Worker, so a bad `routes` change is fixed by deploying a corrected config.

A rolled-back command *schema* does not roll back the registry: re-run
`deploy-commands` from the rolled-back checkout.

### Token rotation (`DISCORD_TOKEN`)

The Worker does not hold this token; only command registration uses it.

1. Discord Developer Portal → application → **Bot** → **Reset Token**.
2. `gh secret set DISCORD_TOKEN --repo RANDSUM/randsum`, and use the new value
   wherever you run `deploy-commands` locally.

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

## npm packages (roller, games, mcp)

Publishing is automated by changesets and npm Trusted Publishing. The flow, the local
fallback and the `workspace:~` rule are in the Publishing section of the root `CLAUDE.md`.

### Rollback

npm does not allow republishing an overwritten version. To "roll back" a bad release:

1. `npm deprecate @randsum/<pkg>@<bad-version> "use <good-version>"` to steer consumers.
2. Publish a new patch version that reverts the change (preferred over `npm unpublish`, which
   is restricted and disruptive).

---

## Incidents

Record an incident's cause and fix in the body of the PR that fixes it, and link that PR
from the related issue.
