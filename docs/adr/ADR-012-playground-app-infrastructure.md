# ADR-012: Playground App Infrastructure

## Status

Superseded by an interactive Expo app (`apps/expo`), which has since been
removed from the monorepo. Designed, never built.

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

**This plan was never implemented.** No `apps/playground/` directory, no
`@randsum/playground` package, no separate Netlify site, and no
`playground.randsum.dev` deployment were ever created. The interactive dice app
effort instead moved to an `apps/expo/` prototype, which has since been removed
from the monorepo. The detailed `package.json`, `astro.config`,
`netlify.toml`, DNS/CNAME setup, and root-script wiring recorded in earlier drafts
of this ADR describe infrastructure that does not exist and have been removed; the
intent above is kept only as a historical record.

## Consequences

- There is no playground subdomain, Netlify site, or workspace package to operate
  or maintain — the operational surface this ADR weighed never materialized.
- The reasoning about deployment isolation and build ordering may inform any
  future interactive app, but the Astro/Netlify specifics did not apply to the
  Expo/EAS target that superseded this plan and has since been removed.
- There is no interactive-app infrastructure in the monorepo today (the `apps/expo`
  prototype was removed); future decisions would start fresh.

## References

- ADR-011: Playground Layout Design (also superseded by the removed `apps/expo`)
- `apps/expo/` — the interactive dice app effort that replaced this plan, since removed
