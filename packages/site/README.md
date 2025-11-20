# @randsum/site

RANDSUM documentation and marketing website built with Astro.

## Overview

This package provides the official documentation and marketing website for the RANDSUM dice rolling system. It's built with Astro for optimal performance and includes documentation for all RANDSUM packages and game-specific implementations.

## Features

- Documentation for all RANDSUM packages
- Game-specific dice rolling guides
- Interactive examples and demos
- Responsive design with modern UI
- SEO optimized with sitemap generation

## Installation

This package is part of the RANDSUM monorepo and uses Bun workspace dependencies.

## Development

```bash
# Install dependencies (from monorepo root)
bun install

# Run development server
bun run --filter @randsum/site dev

# Build for production
bun run --filter @randsum/site build

# Preview production build
bun run --filter @randsum/site preview
```

## Deployment

The site is configured to deploy to Netlify. The build output is in the `dist/` directory.

## License

MIT
