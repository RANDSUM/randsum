# @randsum/site

RANDSUM documentation and marketing site, built with **Astro + Starlight**.

**Live: [randsum.dev](https://randsum.dev)**

> **Private app.** Not published to npm. Deployed to Netlify on push to `main`.

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
  pages/          # Custom landing page (index.astro) + /discord
  components/     # Starlight overrides + React/Astro components
    landing/      # Landing page sections
  utils/          # packageData.ts (package metadata)
  styles/
public/           # static assets
astro.config.mjs  # Starlight config + sidebar topics
```

The home page (`src/pages/index.astro`) is a custom landing page composed from
`src/components/landing/*`. All other docs are Starlight pages under
`src/content/docs/`.

## Deployment

Deployed automatically to Netlify on push to `main` (via `@astrojs/netlify`).

## More

See [`CLAUDE.md`](./CLAUDE.md) for content/component conventions and the root
[`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.

## License

MIT
