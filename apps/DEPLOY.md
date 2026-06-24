# Operations Runbook — Deploy, Rollback & DR

_Last verified against source: 2026-06-13. Covers all deployable apps in this monorepo._

This is the operational counterpart to each app's `CLAUDE.md` (which covers development).
It documents how each surface is hosted, deployed, rolled back, and recovered, plus where
to file incident RCAs.

## Surface map

| Surface            | App                                             | Host            | Trigger                  | URL                   |
| ------------------ | ----------------------------------------------- | --------------- | ------------------------ | --------------------- |
| Docs site          | `apps/site`                                     | Netlify         | push to `main`           | randsum.dev           |
| Notation spec site | `apps/rdn`                                      | Netlify         | push to `main`           | notation.randsum.dev  |
| Discord bot        | `apps/discord-bot`                              | Render (worker) | manual / Render redeploy | n/a (Discord gateway) |
| npm packages       | `packages/roller`, `packages/games`, `apps/cli` | npm registry    | manual `bun publish`     | npmjs.com/org/randsum |

> Config sources: `apps/site/netlify.toml`, `apps/rdn/netlify.toml`,
> `render.yaml` (repo root). Workflow files live in `.github/workflows/` (owned separately —
> see those files for the exact trigger steps).

---

## Netlify (apps/site → randsum.dev, apps/rdn → notation.randsum.dev)

Both Astro sites are separate Netlify projects building from this repo.

- **site** build: `bun run build && bun run site:build`, publish `apps/site/dist`.
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

- The site is fully reproducible from git (`bun run build && bun run site:build`). Loss of
  Netlify state is recoverable by reconnecting the repo and redeploying `main`.
- DNS for `randsum.dev` / `notation.randsum.dev` is the only non-git state — keep the
  registrar and Netlify DNS records documented in the team password vault.

---

## Render (apps/discord-bot)

`render.yaml` (repo root) declares the bot as a Render **worker** service
(`randsum-discord-bot`): build `bun install && bun run build`, start
`node apps/discord-bot/dist/index.js`. Env vars `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`,
`DISCORD_GUILD_ID` are `sync: false` (set in the Render dashboard, never committed).

> Note: `apps/discord-bot/README.md` still describes a self-hosted/pm2 path. The committed
> infra-as-code is Render (`render.yaml`); treat Render as the source of truth for hosting.

### Deploy

Render auto-deploys the worker on push to `main` (per the blueprint). The bot's **slash
commands** are registered separately and are _not_ part of the Render deploy — after changing
a command set, run once:

```bash
cd apps/discord-bot
bun run deploy-commands   # needs DISCORD_TOKEN + DISCORD_CLIENT_ID in the environment
```

(Remove `DISCORD_GUILD_ID` to register globally — ~1h propagation; set it for instant
per-guild registration during development.)

### Restart

Render dashboard → service `randsum-discord-bot` → **Manual Deploy → Restart service** (or
**Suspend** then **Resume**). A worker has no inbound URL; "up" means connected to the Discord
gateway.

### Rollback — redeploy previous commit

1. Render dashboard → `randsum-discord-bot` → **Deploys** (or **Events**) tab.
2. Find the last known-good deploy → **Redeploy** that commit (Render's "Rollback to this
   deploy" / "Redeploy" action rebuilds and restarts the worker on that commit).
3. If a command-schema change is part of the regression, re-run `bun run deploy-commands`
   from the rolled-back checkout to restore the prior command set.

### Token rotation (`DISCORD_TOKEN`)

1. Discord Developer Portal → your application → **Bot** → **Reset Token**; copy the new token.
2. Render dashboard → `randsum-discord-bot` → **Environment** → update `DISCORD_TOKEN` → save.
3. Render restarts the worker with the new secret. (Updating `DISCORD_TOKEN` does not require
   re-running `deploy-commands` — that only changes when commands change.)
4. Invalidate the old token: it is revoked the moment you reset it in the portal, so any
   leaked copy stops working immediately. Audit any place the old value may have leaked.
5. `DISCORD_CLIENT_ID` is the application ID, not a secret, but is also stored in Render env.

### DR notes

- The bot is reproducible from git via the Render blueprint. The only external state is the
  three env vars (set in Render) and the Discord application itself. Keep the Discord app's
  owner/team membership documented so the token can always be rotated.

---

## npm packages (roller, games, cli)

Publishing is **manual** and must use `bun publish` (never `npm publish` — see root
`CLAUDE.md` for the `workspace:~` resolution reason). Order: `@randsum/roller` →
`@randsum/games` → `@randsum/cli`.

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
