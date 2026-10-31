# @randsum/site

RANDSUM documentation and marketing site, built with **Astro + Starlight**.

**Live: [randsum.dev](https://randsum.dev)**

> **Private app.** Not published to npm. Deployed to Cloudflare Workers once CI is green on `main`.

## Development

```bash
# From monorepo root
bun install
bun run site:dev      # Astro dev server (localhost:4321)
bun run site:build    # Production build

# Or from apps/site
bun run dev
bun run build
bun run preview
```

## Structure

```text
src/
  content/docs/   # Starlight docs (.mdx), auto-routed
  pages/          # Custom landing page (index.astro) + /spec + /conformance
  spec/           # /spec layout and components (not Starlight); the spec text and
                  # vectors live in packages/notation-spec
  components/     # Starlight overrides + React/Astro components
    landing/      # Landing page sections
  utils/          # packageData.ts (package metadata)
  styles/
public/           # static assets
astro.config.mjs  # Starlight config + sidebar topics
```

The home page (`src/pages/index.astro`) is a custom landing page composed from
`src/components/landing/*`. The notation spec at `/spec` is a plain Astro page
with its own layout (`src/spec/`). All other docs are Starlight pages under
`src/content/docs/`.

## Deployment

Deployed automatically to Cloudflare Workers once CI is green on `main` (static
assets plus the `/api/roll` Worker in `worker/`, from
`.github/workflows/deploy-cloudflare.yml`).

## More

See [`AGENTS.md`](./AGENTS.md) for content/component conventions and the root
[`AGENTS.md`](../../AGENTS.md) for monorepo-wide rules.

## License

MIT
