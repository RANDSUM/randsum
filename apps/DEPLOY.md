# Operations Runbook — Deploy, Rollback & DR

_Last verified against source: 2026-07-07. Covers all deployable apps in this monorepo._

This is the operational counterpart to each app's `CLAUDE.md` (which covers development).
It documents how each surface is hosted, deployed, rolled back, and recovered, plus where
to file incident RCAs.

## Surface map

| Surface            | App                                             | Host            | Trigger                  | URL                   |
| ------------------ | ----------------------------------------------- | --------------- | ------------------------ | --------------------- |
| Docs site          | `apps/site`                                     | Netlify         | push to `main`           | randsum.dev           |
| Notation spec site | `apps/rdn`                                      | Netlify         | push to `main`           | notation.randsum.dev  |
| Discord bot        | `apps/discord-bot`                              | Render (worker) | manual / Render redeploy | n/a (Discord gateway) |
| npm packages       | `packages/roller`, `packages/games`, `apps/cli` | npm registry    | changesets on merge      | npmjs.com/org/randsum |

> Config sources: `apps/site/netlify.toml`, `apps/rdn/netlify.toml`,
> `render.yaml` (repo root). Workflow files live in `.github/workflows/` (owned separately —
> see those files for the exact trigger steps).
>
> The `randsum.io` playground is a **legacy app deployed outside this monorepo** — it is not
> built or deployed by any config here and is out of scope for this runbook.

---

## Netlify (apps/site → randsum.dev, apps/rdn → notation.randsum.dev)

Both Astro sites are separate Netlify projects building from this repo.

- **site** build: `bun run --filter '@randsum/roller' build && bun run --filter '@randsum/games' build && bun run site:build`, publish `apps/site/dist`.
- **rdn** build: `bun run --filter @randsum/roller build && bun run --filter @randsum/rdn build`, publish `apps/rdn/dist`.
- Deploys are automatic on push to `main`.

### Deploy

Merge to `main`. Netlify builds and publishes automatically. To force a rebuild without a
code change, use **Deploys → Trigger deploy → Deploy site** in the Netlify dashboard
(or `netlify deploy --build --prod` with the Netlify CLI from the app directory).

### Rollback — "publish previous deploy"

1. Netlify dashboard → select the project (randsum.dev or notation.randsum.dev).
2. **Deploys** tab → find the last known-good deploy in the list.
3. Open it → **Publish deploy** (a.k.a. "Publish previous deploy").
4. Netlify instantly re-points the live site to that immutable build — no rebuild needed.

This is atomic and reversible: republishing an older deploy does not delete newer ones, so
you can roll forward again the same way once the fix lands.

### DR notes

- The site is fully reproducible from git (`bun run --filter '@randsum/roller' build && bun run --filter '@randsum/games' build && bun run site:build`). Loss of
  Netlify state is recoverable by reconnecting the repo and redeploying `main`.
- DNS for `randsum.dev` / `notation.randsum.dev` is the only non-git state — keep the
  registrar and Netlify DNS records documented in the team password vault.

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
