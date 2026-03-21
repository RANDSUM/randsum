# notation.randsum.dev — Dice Notation Spec Site Design

**Status:** Approved
**Date:** 2026-03-20

## Goal

Build a standalone Astro 6 app (`apps/spec`) that renders the RANDSUM Dice Notation Specification as a navigable, accessible, single-page web application at `notation.randsum.dev`. The markdown spec file remains the source of truth; the site is a presentation layer.

## Decisions Made

| Decision | Choice | Alternatives Considered |
|----------|--------|------------------------|
| Navigation model | Scroll-based SPA with sticky sidebar TOC | Section-at-a-time view; hybrid tabs+scroll |
| Brand relationship | Sibling identity (distinct but family) | Clone of main site; fully independent |
| Accent color | Cyan/teal (#06b6d4) on zinc grays | Orange, emerald, blue |
| Layout | Three-column (MDN style) | Two-column wide content |
| Header | Hero that scrolls away | Slim persistent header |

## Architecture

### App Location

`apps/spec/` in the monorepo. Private package (`"private": true`). No dependencies on `@randsum/roller` or other workspace packages — the spec site is purely a markdown presentation layer.

### Content Pipeline

```
RANDSUM_DICE_NOTATION_SPEC.md (repo root)
  |
  | (copied at build time to apps/spec/src/content/specs/)
  v
Astro content collection (specs/)
  |
  | (remark/rehype pipeline)
  v
Rendered HTML in three-column layout
```

The spec markdown file at repo root is the source of truth. A build script copies it into the content collection. Versioned specs are stored as `apps/spec/src/content/specs/v1.0.md`, with the latest always copied from root.

### Versioning

- Spec versions stored as: `apps/spec/src/content/specs/v1.0.md`, `v1.1.md`, etc.
- **Implementation**: Each version gets its own static page via Astro dynamic routes (`[version].astro`). Build produces `/v/1.0/index.html`, `/v/1.1/index.html`, etc. The root `index.astro` renders the latest version directly (no redirect).
- URL scheme: `notation.randsum.dev` (latest) or `notation.randsum.dev/v/1.0` (specific version)
- The version dropdown links between pages (standard `<a>` navigation, no client-side routing)
- **LLM-friendly**: Each version URL contains only that version's content. Crawlers and LLMs see a single clean document per URL.
- **Invalid version**: Astro's static build only generates pages for versions that exist. Unknown paths hit the 404 page.
- `llms.txt` and `llms-full.txt` at the site root point to the latest version.

### No Starlight

The main site uses Starlight. This app does NOT — Starlight is opinionated about sidebar structure, multi-page routing, and theming in ways that conflict with the single-page, scroll-based spec viewer. A custom Astro layout gives us full control over the three-column layout, scroll spy behavior, and hero header.

## Page Structure

```
+--------------------------------------------------------------+
|  [Hero Header]                          [v1.0 (latest) v]    |
|  "SPECIFICATION" label                          [GitHub]      |
|  "Randsum Dice Notation" title                                |
|  Subtitle text                                                |
|  (scrolls away on scroll)                                     |
+------------+---------------------------------+----------------+
|  Sidebar   |  Content                        |  On This Page  |
|  (sticky)  |  (scrolls)                      |  (sticky)      |
|            |                                 |                |
| FOUNDATIONS|  Section 1. Introduction         |  1.1 Purpose   |
|  1. Intro  |  --- cyan gradient rule ---     |  1.2 Scope     |
|  2. Gloss  |  Body text...                   |  1.3 Conv.     |
|  3. Class  |                                 |                |
|            |  [RFC 2119 callout box]          |                |
| FEATURES   |                                 |                |
|  4. Dice   |  Section 1.1 Purpose            |                |
|  5. Cond   |  Body text...                   |                |
|            |                                 |                |
| PIPELINE   |  Section 2. Glossary            |                |
|  6. Exec   |  --- cyan gradient rule ---     |                |
|  7. Groups |  [Definition table]             |                |
|            |                                 |                |
| REFERENCE  |  ...continues...                |                |
|  8. Syntax |                                 |                |
|  9. Safety |                                 |                |
|  10. Conf  |                                 |                |
|            |                                 |                |
| APPENDICES |                                 |                |
|  A. Prior  |                                 |                |
|  B. Desug  |                                 |                |
|  C. Facets |                                 |                |
|  D. 4-Gate |                                 |                |
+------------+---------------------------------+----------------+
```

### Sidebar Groups

The sidebar organizes sections into logical groups:

| Group | Sections |
|-------|----------|
| **Foundations** | 1. Introduction, 2. Glossary, 3. Classification System |
| **Features** | 4. Dice Expressions, 5. Condition Expressions |
| **Pipeline** | 6. Execution Pipeline, 7. Operational Groups |
| **Reference** | 8. Notation Syntax, 9. Safety and Limits, 10. Conformance Levels |
| **Appendices** | A. Priority Table, B. Alias Desugaring, C. Faceted Records, D. Four-Gate Test |

These groups are presentational labels in the sidebar, not structural changes to the spec content.

## Components

### 1. HeroHeader

- Scrolls away when user scrolls down
- Contains: "SPECIFICATION" label (cyan, uppercase, tracked), "Randsum Dice Notation" title (large, white), subtitle, version dropdown (top-right), GitHub icon link
- Subtle cyan gradient background tint
- Once scrolled past, sidebar and right TOC become sticky (`position: sticky; top: 0`). There is NO persistent slim header — the sidebar itself is the persistent navigation. The version dropdown is also accessible within the sidebar (duplicated below the site title as a compact version indicator when the hero is scrolled away)

### 2. SidebarNav

- Fixed-width left column (220px)
- Sticky positioning (sticks below hero header)
- Section links grouped by category (Foundations, Features, Pipeline, Reference, Appendices)
- Category labels: small, uppercase, tracked, zinc-500 color
- Active section: cyan text + cyan-tinted background pill
- Smooth scroll on click
- Collapsible on mobile (hamburger menu)

### 3. SpecContent

- Central column, max-width ~720px for readability
- Rendered from parsed markdown
- Each `## ` heading gets an `id` attribute for anchor linking
- Section numbers preserved from the spec (e.g., "6.4.2 Cap")
- Custom styling for:
  - **Tables**: cyan header row (#06b6d4 bg, white text), alternating zinc-800/zinc-900 rows, rounded corners
  - **Callout boxes**: blockquotes rendered as cyan-bordered info panels
  - **Faceted record headers**: `Primitive | Stage 2 | ...` rendered as inline badge/tag strips
  - **Code spans**: JetBrains Mono, zinc-800 background, slight border
  - **Section dividers**: thin cyan-to-transparent gradient lines under each `## ` heading
  - **Definition lists** (Glossary): term in bold, definition indented

### 4. OnThisPage (right sidebar)

- Fixed-width right column (160px)
- Sticky positioning
- Shows `### ` and `#### ` headings belonging to the `## ` section whose heading is closest to (and above) the viewport top. When the user scrolls past a new `## ` heading, the right TOC re-populates with that section's sub-headings. An IntersectionObserver on each `## ` heading drives this.
- Scroll spy: highlights the sub-heading closest to the viewport top
- Title: "On this page" (small, uppercase, zinc-500)
- Hidden below 1024px viewport width

### 5. VersionDropdown

- Positioned in the hero header (top-right area)
- Shows current version with "(latest)" badge if applicable
- Dropdown lists all available spec versions
- Selection updates `?v=` query parameter
- Non-latest versions show a banner below the hero: "You are viewing an older version of this specification. [View latest →]"

## Visual Design

### Colors

```
Accent:           #06b6d4 (cyan-500)
Accent light:     #22d3ee (cyan-400, for hover)
Accent dark:      #0891b2 (cyan-600, for active)
Accent tint:      rgba(6, 182, 212, 0.08) (backgrounds)
Accent border:    rgba(6, 182, 212, 0.2) (callout borders)

Background:       #1a1a1f (zinc-950)
Surface:          #222228 (zinc-900)
Border:           #2e2e35 (zinc-800)
Text primary:     #fafafa (zinc-50)
Text secondary:   #a1a1aa (zinc-400)
Text muted:       #71717a (zinc-500)
Text dim:         #52525b (zinc-600)
```

### Typography

```
Body:      Inter, 15px, line-height 1.7
Headings:  JetBrains Mono, various weights
Code:      JetBrains Mono, 13px
Nav:       Inter, 13px
Labels:    Inter, 10px, uppercase, letter-spacing 1.5px
```

### Light Mode

Dark mode is default. Light mode is a stretch goal, not required for v1. When implemented:

```
Background:       #fafafa (zinc-50)
Surface:          #f4f4f5 (zinc-100)
Border:           #e4e4e7 (zinc-200)
Text primary:     #18181b (zinc-900)
Text secondary:   #52525b (zinc-600)
Text muted:       #71717a (zinc-500)
Accent:           #0891b2 (cyan-600, darker for light backgrounds)
Accent tint:      rgba(8, 145, 178, 0.06)
```

## Accessibility

- **Semantic HTML**: `<nav aria-label="Spec sections">`, `<main>`, `<article>`, `<section>`, `<aside aria-label="On this page">`
- **Skip link**: "Skip to content" link before the header, visible on focus
- **Keyboard nav**: All sidebar links focusable, Enter navigates, Tab cycles through interactive elements
- **ARIA**: `aria-current="true"` on active sidebar item, `aria-expanded` on mobile menu, `role="listbox"` on version dropdown
- **Focus indicators**: Cyan outline ring on focus-visible
- **Motion**: `prefers-reduced-motion` disables smooth scroll, uses instant jumps
- **Contrast**: All text/background combinations meet WCAG AA (cyan #06b6d4 on zinc-950 = 8.1:1 ratio)
- **Screen reader**: Section headings are `<h2>`-`<h4>` in proper hierarchy, tables have `<caption>` elements

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| >= 1280px | Full three-column (sidebar 220px, content, right TOC 160px) |
| 1024-1279px | Two-column (sidebar + content, right TOC hidden) |
| < 1024px | Single-column (sidebar collapses to hamburger overlay, content full-width) |

Mobile hamburger menu: fixed button in top-left, opens full-height overlay with all section links. Closes on navigation or outside tap.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Astro 6 | Static site framework (matches existing site version), `output: 'static'` |
| Plain CSS (custom properties) | Styling — no Tailwind to keep it lightweight |
| Vanilla TS in `<script>` tags | Scroll spy, version switching, mobile menu (~2KB). Astro compiles these to JS at build time. NOT standalone modules — they live inside Astro component `<script>` blocks. |
| Netlify | Deployment (matches existing site) |

No React, no Tailwind, no Starlight, no `@astrojs/netlify` adapter (static output needs no adapter). This is a lean spec viewer.

## File Structure

```
apps/spec/
  package.json
  astro.config.ts
  netlify.toml             -- deploy config (publish dir, build command)
  src/
    pages/
      index.astro          -- renders latest spec version
      v/[version].astro    -- dynamic route, one page per spec version
      404.astro            -- not found page (minimal, links to notation.randsum.dev)
    layouts/
      SpecLayout.astro     -- three-column layout shell
    components/
      HeroHeader.astro     -- scrolling hero with version dropdown
      SidebarNav.astro     -- left navigation with version indicator
      SpecContent.astro    -- rendered markdown content
      OnThisPage.astro     -- right-side heading TOC
      VersionDropdown.astro -- version selector (links between /v/X.Y pages)
      VersionBanner.astro  -- "viewing older version" banner
      MobileMenu.astro     -- hamburger overlay for mobile
      SkipLink.astro       -- skip-to-content accessibility link
      ShareActions.astro   -- copy-to-MD, open-in-Claude/ChatGPT buttons
    content/
      specs/
        v1.0.md            -- spec version 1.0 (copied from repo root at build)
    styles/
      global.css           -- all styles (custom properties, layout, components)
    content.config.ts      -- Astro content collection definition
  scripts/
    copy-latest-spec.sh   -- copies RANDSUM_DICE_NOTATION_SPEC.md to content/specs/
  public/
    favicon.ico
    llms.txt              -- brief description + link to latest
    llms-full.txt         -- generated at build: full spec markdown
```

Client-side TypeScript (scroll spy, mobile menu) lives inside Astro component `<script>` blocks, not as standalone files. Astro compiles these to bundled JS at build time. Version switching is standard `<a>` navigation between static pages — no client JS needed.

## Build Integration

- `package.json` scripts: `dev`, `build`, `preview`
- `prebuild` script: `scripts/copy-latest-spec.sh` copies `../../RANDSUM_DICE_NOTATION_SPEC.md` to `src/content/specs/v1.0.md`. Fails with a clear error if the source file is missing.
- `netlify.toml`:
  ```toml
  [build]
    command = "bun run build"
    publish = "dist"
    base = "apps/spec"
  ```
- No redirects needed — the site is a single `index.html` with client-side `?v=` handling. Netlify serves `index.html` for all paths by default for SPAs.

## Error States

- **No spec files at build time**: `copy-latest-spec.sh` fails the build with an error message pointing to the expected file location.
- **Invalid `?v=` parameter**: Client JS falls back to latest version, corrects the URL silently via `replaceState`.
- **404 page**: Minimal page with the cyan accent, "Page not found" message, and a link back to `notation.randsum.dev`.

## LLM & Share Actions

A floating action bar (bottom-right or top-right of content area) provides:
- **Copy as Markdown** — copies the current version's spec content as markdown to clipboard
- **Open in Claude** — opens Claude.ai with the spec content pre-loaded
- **Open in ChatGPT** — opens ChatGPT with the spec content pre-loaded
- **llms.txt** — `/llms.txt` at site root with brief description + link to latest spec
- **llms-full.txt** — `/llms-full.txt` with the full spec markdown for the latest version

This mirrors the `starlight-page-actions` plugin on the main site but implemented as a custom Astro component since we're not using Starlight.

## Out of Scope

- Search within the spec (future enhancement)
- PDF export
- Edit-on-GitHub links (future enhancement)
- Syntax highlighting for dice notation (future — would need a custom Shiki grammar)
- Interactive dice roller embedded in the spec
