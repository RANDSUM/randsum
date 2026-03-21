# ADR-016: Static Version Embedding for Spec Version Switching

## Status

Accepted

## Context

`notation.randsum.dev` needs to display multiple versions of the RANDSUM Dice Notation Specification. A reader consulting an older version of the spec (for example, to understand what a library pinned to v1.0 implements) should be able to navigate to that version without leaving the site or following a separate URL to a different deployment.

Three approaches were evaluated:

### Option A: SSR with query parameter routing

A server-side rendered Astro app reads `?v=` from the request, fetches the corresponding spec version, and renders it. The user receives exactly the HTML they requested; no extra version content is sent over the wire.

Rejected because the spec site is `output: 'static'`. SSR requires an adapter and a serverless function runtime. Static hosting (Netlify, plain CDN) is the target deployment model — it is simpler, cheaper, faster to deploy, and matches the precedent set by `apps/site/` and `apps/playground/`. Adding an SSR adapter to a spec viewer is infrastructure overengineering.

### Option B: Separate static pages per version

Generate one page per version: `/`, `/?v=1.0`, `/?v=1.1` — or alternatively `/v/1.0/index.html`, `/v/1.1/index.html`. Each page contains only the content for that version.

This is the standard static multi-version documentation pattern used by tools like Sphinx and Docusaurus. For large documentation sets with tens of versions, it is the correct choice.

For the spec site, the expected version count is small — the spec started at v1.0 and is unlikely to exceed five versions in its first two years. Generating separate pages per version introduces redirect rules, deployment complexity, and a `?v=` → file path mapping that must be maintained in `netlify.toml`. For three or fewer versions, this complexity is disproportionate.

### Option C: All versions embedded in one page, toggled client-side

All version content is rendered into a single `index.html` at build time. Each version is wrapped in a `<div data-version="1.0" hidden>` container. On page load, a small client script reads `?v=` from the URL, removes `hidden` from the matching container, and leaves all others hidden. If `?v=` is absent or invalid, the latest version's container is shown and the URL is corrected via `history.replaceState`.

This approach has no SSR, no redirects, no separate deployment artifacts. It is a single static file that Netlify serves for all requests. Version switching is instant — the content is already in the DOM.

The cost is page weight: each additional version adds the full text of the spec to the HTML payload. The spec is a single markdown document; rendered HTML for one version is approximately 200-400 KB uncompressed, well under 100 KB gzipped. For five versions the payload would be under 500 KB gzipped. This is acceptable for a technical specification site where readers are on reasonably capable devices and the trade-off is simplicity.

## Decision

`apps/spec/` uses Option C: all spec versions are embedded in a single HTML page with `data-version` containers, toggled by client-side JavaScript.

The implementation contract:

- Each version's content is wrapped: `<div data-version="1.0" hidden> ... </div>`. Only one container has `hidden` removed at any time.
- The client script runs on `DOMContentLoaded`. It reads `location.search`, parses `?v=`, finds the matching container, removes `hidden`, and updates the version dropdown's displayed value.
- If `?v=` is absent: show the latest version. Do not modify the URL.
- If `?v=` is present and matches a known version: show that version's container. Leave the URL as-is.
- If `?v=` is present and does not match any known version: show the latest version, correct the URL to remove the invalid `?v=` parameter via `history.replaceState`.
- The version dropdown, when changed, calls `history.replaceState` to update `?v=` without a page reload, then toggles container visibility.
- Non-latest versions display a banner: "You are viewing an older version of this specification. View latest →"

Available versions are determined at build time by the content collection entries in `src/content/specs/`. The version list is embedded in the page as a data attribute or inline JSON object so the client script can enumerate known versions without a separate API call.

The `prebuild` script (`scripts/copy-latest-spec.sh`) copies `RANDSUM_DICE_NOTATION_SPEC.md` from the repo root to `src/content/specs/v<current>.md` before each build. Versioned historical specs are committed directly to `src/content/specs/`.

## Consequences

### Positive

- Deployment is a single static file. No server-side routing, no Netlify redirect rules, no adapter. The site deploys identically to a CDN, S3 bucket, or GitHub Pages as it does to Netlify.
- Version switching is instant. There is no network request on version change — the content is already parsed and in the DOM. This makes the reading experience feel like a client-side application for the common case of consulting one or two versions.
- The implementation is transparent and auditable. The `hidden` attribute on DOM containers is visible in browser dev tools; there is nothing hidden about what is happening.
- Invalid `?v=` parameters are handled gracefully without 404 pages or server-side redirect logic.
- The version count of 1-5 over the spec's expected lifetime keeps payload size well within acceptable bounds.

### Negative

- Page payload grows linearly with versions. If the spec ever reaches 10+ versions, the page weight will be noticeable. At that point, Option B (separate pages) should be reconsidered. The client-side toggling script is small enough that migrating to per-page generation would not require rewriting the interaction model — only the build-time output strategy.
- All versions are transmitted to the reader, including versions they did not request. On slow connections this inflates time-to-first-byte slightly for readers who only need the latest version. This is considered acceptable for a technical specification with a small, intentional audience.
- The `hidden` container approach relies on the client script running to show any content. If JavaScript is disabled, no spec content is visible. The spec site is a JavaScript-authored Astro application; it already requires JS for scroll spy and the mobile menu. Requiring JS for version display is consistent with the site's baseline assumptions.

## References

- Design spec: `docs/superpowers/specs/2026-03-20-spec-site-design.md` — version switching section
- ADR-017: Vanilla TypeScript for Client Interactivity — the version-switching script is part of the client JS addressed in that ADR
- `apps/spec/src/content/specs/` — versioned spec storage location
- `apps/spec/scripts/copy-latest-spec.sh` — prebuild spec copy script
