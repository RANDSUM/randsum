# @randsum/rdn

The **RANDSUM Dice Notation (RDN) Specification** site — the normative spec hosted at
[notation.randsum.dev](https://notation.randsum.dev). Built with Astro.

> **Private app.** Not published to npm. Deployed to Netlify on push to `main`
> (see [`netlify.toml`](./netlify.toml) and [`apps/DEPLOY.md`](../DEPLOY.md)).

It also generates the normative conformance vectors under `public/conformance/` from
`@randsum/roller` via `conformance-gen.ts`.

## Commands

```bash
bun run --filter @randsum/rdn dev               # Astro dev server (localhost:4322)
bun run --filter @randsum/rdn build             # Production build → apps/rdn/dist
bun run --filter @randsum/rdn conformance:gen   # Regenerate conformance vectors
bun run --filter @randsum/rdn conformance:check # Verify vectors match roller output
bun run --filter @randsum/rdn check             # build + typecheck + format + lint + test
```

## More

See [`CLAUDE.md`](./CLAUDE.md) in this directory for content/spec conventions and the root
[`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.
