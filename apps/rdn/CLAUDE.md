# @randsum/rdn — RANDSUM Dice Notation Spec Site

## Overview

Pure Astro app that serves the formal RANDSUM Dice Notation (RDN) specification at `notation.randsum.dev`. No React, no Starlight — just Astro with Markdown content. Spec documents live in `src/content/specs/` as versioned Markdown files. Each version is reachable at `/v/<version>` (e.g. `/v/1.0-alpha`). The root `/` redirects to the latest version.

## Directory Structure

```
apps/rdn/
  src/
    content/
      specs/         # Versioned spec documents (*.md, ID = filename minus .md minus leading v)
    pages/
      index.astro    # Redirects to latest spec version
      404.astro
      v/
        [version].astro  # Dynamic route — renders a spec entry by version ID
    layouts/
      SpecLayout.astro   # Full-page shell (header, sidebar, aside, footer)
    components/
      SpecContent.astro  # Renders the Markdown body
      SidebarNav.astro   # Version-aware nav sidebar
      OnThisPage.astro   # Heading-based table of contents
      VersionBanner.astro
      VersionDropdown.astro
      HeroHeader.astro
      ShareActions.astro
      MobileMenu.astro
      SkipLink.astro
    utils/
      versions.ts    # getVersions(), getLatestVersion(), isLatestVersion()
    styles/
      global.css
    content.config.ts  # Astro content collection (glob loader, ID = version string)
  public/
    llms.txt
    llms-full.txt
  astro.config.ts
  netlify.toml
```

## Commands

```bash
bun run dev          # Astro dev server (localhost:4321)
bun run build        # Static build to dist/
bun run preview      # Preview built output
bun run typecheck    # astro check
bun run lint         # ESLint
bun run format       # Prettier
bun run check        # build + typecheck + format:check + lint
```

## Content Authoring

Add a new spec version by creating `src/content/specs/<version>.md` (e.g. `v1.1.md`).

The content collection ID strips the leading `v` and the `.md` extension — so `v0.9.0.md` becomes ID `0.9.0`. The `[version].astro` route uses this ID as the URL segment.

`getVersions()` sorts versions semantically: pre-release tags (e.g. `-alpha`) sort before the release of the same number. `getLatestVersion()` returns the last item in the sorted list.

Frontmatter fields are all optional: `title`, `version`, `status`, `date`.

## Key Constraints

- No workspace dependencies — only `astro` itself.
- Private app, never published to npm.
- Deployed to Netlify (see `netlify.toml`).
- Fonts: Inter (body) and JetBrains Mono (code/headings), loaded via Astro font optimization.
