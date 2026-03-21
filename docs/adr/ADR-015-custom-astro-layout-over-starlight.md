# ADR-015: Custom Astro Layout Over Starlight for notation.randsum.dev

## Status

Accepted

## Context

The RANDSUM ecosystem already uses Starlight for the main documentation site (`apps/site/`). When designing `apps/spec/` — the notation specification viewer at `notation.randsum.dev` — reusing Starlight was the natural first option to evaluate. It would provide built-in search, sidebar configuration, i18n scaffolding, and maintained Astro integration.

The notation spec site has requirements that are structurally incompatible with Starlight's design assumptions:

**Single-page, scroll-based reading model.** The spec is a single continuous document — a formal specification with numbered sections, not a multi-page documentation tree. Starlight is built around multi-page routing, where each page is a discrete unit and the sidebar lists pages. Adapting Starlight to treat the entire spec as one scrollable page would require fighting its routing and layout machinery rather than using it.

**Three-column MDN-style layout.** The design calls for a left sidebar (section navigation), a central content column, and a right "On This Page" column (subsection TOC). Starlight's two-column layout is configurable but not three-column at the component level. Achieving three columns would require slot overrides for both the sidebar and the content area, plus custom CSS to inject the right rail — effectively replacing most of Starlight's layout.

**Scroll spy on both sidebars.** The left sidebar highlights the active `##` section as the user scrolls. The right TOC tracks which `###`/`####` heading is closest to the top of the viewport and re-populates when the user crosses a `##` boundary. Starlight's built-in TOC covers only the right-rail case and has no concept of a two-level scroll spy across two separate navigation panels. Adding this behavior requires IntersectionObserver logic that Starlight has no hook for.

**Hero header that scrolls away.** The design calls for a large hero header (containing the spec title, version dropdown, and GitHub link) that disappears on scroll, leaving only the three-column body sticky. Starlight has a persistent slim header with no scroll-away behavior. Removing or transforming it requires overriding the `<Head>` and `<Header>` slots and disabling Starlight's own sticky header CSS.

**Version switching via `data-version` containers.** All spec versions are embedded in a single HTML page at build time and toggled client-side. This pattern has no analog in Starlight's content model, which maps one content collection entry to one page. Embedding multiple hidden document subtrees in a single page would require bypassing Starlight's content rendering pipeline entirely.

**No Tailwind.** The spec site uses plain CSS with custom properties to stay lightweight. Starlight uses its own CSS variables and expects a specific theming surface. Mixing plain CSS with Starlight's layer requires careful specificity management that adds maintenance burden.

The cumulative effect of these conflicts is that adopting Starlight for `apps/spec/` would require overriding the majority of Starlight's layout, routing, and content pipeline — leaving behind only Astro itself. That is the same as writing a custom layout with extra constraints imposed by an unused framework.

## Decision

`apps/spec/` uses a custom Astro layout (`SpecLayout.astro`) with no Starlight dependency.

The layout shell is three-column:

- `SidebarNav.astro` — left rail, 220px, sticky, section links grouped by category
- `SpecContent.astro` — central column, max-width 720px, rendered markdown
- `OnThisPage.astro` — right rail, 160px, sticky, subsection TOC

Client interactivity (scroll spy, version switching, mobile menu) is handled by vanilla TypeScript inside Astro `<script>` blocks, compiling to approximately 2 KB of bundled JS. This is addressed in full in ADR-017.

The spec site shares the visual identity family (zinc gray backgrounds, JetBrains Mono headings) but uses cyan (`#06b6d4`) as its accent color rather than the main site's purple. This gives it a sibling identity — recognizably RANDSUM, distinctly the specification.

Styling uses plain CSS with custom properties in `src/styles/global.css`. No Tailwind, no CSS-in-JS.

## Consequences

### Positive

- Full control over the three-column layout, scroll spy behavior, hero animation, and version container structure. No Starlight assumptions to work around.
- The layout can be precisely tuned to the specification reading experience — section dividers, callout box styling, definition list formatting, faceted record badge rendering — without fighting framework opinions.
- Bundle size is minimal. There is no Starlight runtime, no search index, no framework-specific hydration overhead.
- The CSS surface is fully owned. Custom properties can be changed without consulting Starlight's theming layer.

### Negative

- No Starlight built-in search. Full-text search within the spec is out of scope for v1; if it is added later, it must be implemented from scratch (e.g., Pagefind integration, which is also used by Starlight and is fully compatible with static Astro sites).
- No Starlight i18n scaffolding. Internationalization of the spec is not a near-term requirement, but if it becomes one, the infrastructure must be built without Starlight's locale routing.
- The layout, sidebar, and scroll spy components are custom code that must be maintained. Starlight upgrades would have kept this code at zero maintenance cost.
- Future contributors familiar with Starlight from `apps/site/` will encounter a different setup in `apps/spec/`. The two apps are intentionally distinct and the design spec documents this divergence.

## References

- Design spec: `docs/superpowers/specs/2026-03-20-spec-site-design.md`
- ADR-011: Playground Layout Design — prior decision to use a custom layout for `apps/playground/`, establishing the precedent of non-Starlight apps in this monorepo
- ADR-012: Playground App Infrastructure — further context on how non-Starlight apps are structured
- `apps/site/` — the main site that uses Starlight, for contrast
