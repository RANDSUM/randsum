# ADR-012: Playground App Infrastructure

## Status

Superseded. The playground was built as `apps/playground/` in #1014 and deleted in
`793ff71b` when the Expo app (#1021) took over its role; that app was removed in #1121.
Both were tried and removed: do not resurrect either.

## Context

Epic #938 proposed deploying the interactive playground (see ADR-011) as a
standalone app, separate from the docs site at `randsum.dev`. The motivation was
to avoid fighting Starlight's documentation layout, to let the playground deploy
on its own cadence, and to give it a distinct product surface. This ADR captured
the intended infrastructure before any code existed.

## Decision

Plan the playground as a private Astro workspace package at `apps/playground/`
(`@randsum/playground`, never published), depending on `@randsum/roller` and
`@randsum/display-utils`, deployed as a separate Netlify site at
`playground.randsum.dev`, excluded from the publish-oriented root build and from
`check:all`.

`apps/playground/` was built in #1014, served from a Netlify project at
`playground.randsum.dev`, and deleted in `793ff71b` in favour of an `apps/expo/`
prototype, which has since been removed from the monorepo. The Netlify project and
the DNS name were retired in the 2026-08-18 Cloudflare migration. The detailed `package.json`, `astro.config`,
`netlify.toml`, DNS/CNAME setup, and root-script wiring recorded in earlier drafts
of this ADR describe infrastructure that no longer exists and have been removed; the
intent above is kept only as a historical record.

## Consequences

- There is no playground subdomain, Netlify site, or workspace package left to
  operate or maintain.
- The reasoning about deployment isolation and build ordering may inform any
  future interactive app, but the Astro/Netlify specifics did not apply to the
  Expo/EAS target that superseded this plan and has since been removed.
- There is no interactive-app infrastructure in the monorepo today (the `apps/expo`
  prototype was removed); future decisions would start fresh.

## References

- ADR-011: Playground Layout Design (also superseded by the removed `apps/expo`)
- `apps/expo/` — the interactive dice app effort that replaced this plan, since removed
