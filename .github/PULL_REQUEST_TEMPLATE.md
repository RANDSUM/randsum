<!-- Thanks for the PR! Keep it tight — short PRs land faster. -->

## Summary

<!-- 1–3 sentences: what changed and why. -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (API, output shape, or semantics)
- [ ] Docs / chore / refactor (no runtime change)

## Affected packages

<!-- Tick the packages you touched. -->

- [ ] `@randsum/roller`
- [ ] `@randsum/games` (and which subpath: blades / daggerheart / fate / fifth / pbta / root-rpg / salvageunion / schema)
- [ ] `@randsum/mcp`
- [ ] `@randsum/ui`
- [ ] `@randsum/notation-spec`
- [ ] `apps/site`, `apps/api`, `apps/discord-bot`
- [ ] `plugins/randsum` (Claude Code plugin)
- [ ] Infra / CI / tooling

## Checklist

- [ ] `bun run check` passes locally
- [ ] Changeset added (`bun run changeset`) if a published package changed (roller, games, mcp, ui, notation-spec)
- [ ] Tests cover the change (unit, property, or stress as appropriate)
- [ ] Bundle size limits respected (run `bun run size` if a publishable package changed)
- [ ] Public API changes are reflected in the matching README / `apps/site` MDX
- [ ] Game-package changes regenerate via `bun run --filter @randsum/games gen` (no hand-edits to `*.generated.ts`)
