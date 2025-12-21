# @randsum/site - Documentation Website

## Overview

Astro-based static site for documentation and marketing. Deploys to Netlify.

## Astro Conventions

- Pages in `src/pages/` directory
- Components in `src/components/`
- Layouts in `src/layouts/`
- Styles in `src/styles/`
- Static assets in `public/`

## Page Structure

```
src/pages/
  index.astro           # Homepage
  packages/
    {package}.astro     # Package documentation pages
  games/
    {game}.astro        # Game-specific pages
  tools/
    index.astro         # Tools overview
```

## React Integration

Uses `@astrojs/react` for React components:
- Components can use React
- Prefer Astro components when possible
- React for interactive features

## Component Patterns

- `PackageCard.astro` - Displays package information
- `CodeExample.astro` - Syntax-highlighted code blocks
- `BaseLayout.astro` - Main layout wrapper

## Package Data

Package metadata defined in `src/utils/packageData.ts`:
- `corePackages` - Core packages array
- `gamePackages` - Game system packages
- `toolPackages` - Tool packages

## Styling

CSS files in `src/styles/`:
- Uses CSS custom properties for theming
- Responsive design patterns
- Consistent spacing via CSS variables

## Build & Deploy

```bash
bun run dev        # Development server
bun run build      # Production build
bun run preview    # Preview production build
```

Deploys automatically to Netlify on push to main branch.

