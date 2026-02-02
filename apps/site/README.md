# @randsum/site

RANDSUM documentation website built with Astro.

**Live: [randsum.dev](https://randsum.dev)**

## Development

```bash
# From monorepo root
bun install
bun run site:dev      # Start dev server
bun run site:build    # Build for production
```

## Structure

```text
src/
  pages/        # Route pages
  components/   # React/Astro components
  layouts/      # Page layouts
public/
  api/          # Generated TypeDoc API docs (via `bun run docs:site`)
```

## Deployment

Deployed automatically to Netlify on push to `main`.

## License

MIT
