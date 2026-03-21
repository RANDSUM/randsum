# ADR-016: Per-Version Static Pages for Spec Versioning

## Status

Accepted (amended — originally proposed all-in-one-page embedding, revised to per-version pages for LLM friendliness)

## Context

`notation.randsum.dev` needs to display multiple versions of the RANDSUM Dice Notation Specification. Readers consulting an older version (e.g., to understand what a library pinned to v1.0 implements) should navigate to that version without leaving the site.

Additionally, the site must be **LLM-friendly**: a language model reading a spec URL should see only the content for that version, not all versions interleaved.

Three approaches were evaluated:

### Option A: SSR with query parameter routing

A server-side rendered Astro app reads `?v=` from the request, fetches the corresponding spec version, and renders it. Rejected because the spec site is `output: 'static'` — SSR requires an adapter and serverless runtime, which is infrastructure overengineering for a spec viewer.

### Option B: Separate static pages per version

Generate one page per version via Astro dynamic routes: `v/[version].astro` produces `/v/1.0/index.html`, `/v/1.1/index.html`, etc. The root `index.astro` renders the latest version directly. Each URL contains only that version's content.

### Option C: All versions embedded in one page, toggled client-side

All version content rendered into a single `index.html` with `<div data-version="1.0" hidden>` containers toggled by JavaScript.

This was the original proposal. It was rejected because:
- **LLM unfriendly**: Crawlers and LLMs see ALL versions in the HTML, regardless of which is displayed. An LLM asked to "read the spec at notation.randsum.dev" would ingest all versions simultaneously, creating confusion.
- **No per-version canonical URL**: There is no way to link to a specific version with a clean URL that serves only that version's content.
- **SEO concerns**: Hidden content in the DOM is visible to search engine crawlers.

## Decision

`apps/spec/` uses **Option B**: one static page per version, generated at build time via Astro dynamic routes.

The implementation contract:

- `src/content/specs/` contains one markdown file per version: `v1.0.md`, `v1.1.md`, etc.
- `src/pages/v/[version].astro` is a dynamic route that generates one page per content entry.
- `src/pages/index.astro` renders the latest version directly (same layout, no redirect).
- The version dropdown is a set of `<a>` links between pages — standard navigation, no client-side routing needed.
- Non-latest versions display a banner: "You are viewing an older version of this specification. [View latest]"
- `public/llms.txt` provides a brief description and link to the latest spec.
- `public/llms-full.txt` is generated at build time containing the full latest spec markdown.
- The `prebuild` script copies `RANDSUM_DICE_NOTATION_SPEC.md` from repo root to `src/content/specs/v<current>.md`.

## Consequences

### Positive

- **LLM-friendly**: Each URL serves exactly one version. Crawlers, LLMs, and screen scrapers see clean, unambiguous content.
- **Per-version canonical URLs**: `notation.randsum.dev/v/1.0` is a stable, shareable, bookmarkable link.
- **No JavaScript required for version display**: Content renders server-side (at build time). JS-disabled browsers see the full spec.
- **SEO-clean**: No hidden content in the DOM.
- **Scales indefinitely**: Adding a version adds a page, not payload to every page.

### Negative

- **Version switching requires a page load**: Unlike the client-side toggle approach, switching versions navigates to a new page. For a spec viewer with infrequent version switching, this is acceptable.
- **Slightly more complex build**: Astro dynamic routes with `getStaticPaths()` are well-documented but add a layer vs a single `index.astro`.

## References

- Design spec: `docs/superpowers/specs/2026-03-20-spec-site-design.md`
- ADR-017: Vanilla TypeScript for Client Interactivity
- `apps/spec/src/content/specs/` — versioned spec storage
