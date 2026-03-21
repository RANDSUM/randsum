# ADR-017: Vanilla TypeScript for Client Interactivity in apps/spec

## Status

Accepted

## Context

`apps/spec/` requires three pieces of client-side interactivity:

1. **Scroll spy** — two-level: the left sidebar highlights the active `##` section; the right "On This Page" panel tracks `###`/`####` headings within the currently visible `##` section, re-populating its list when the active section changes.
2. **Mobile hamburger menu** — below 1024px, the sidebar collapses into a fixed overlay opened by a hamburger button and closed by navigation or an outside tap.

Note: Version switching was originally listed here as a third piece of client-side interactivity. Per ADR-016 (amended), versioning now uses separate static pages with standard `<a>` navigation — no client-side JavaScript is needed for version switching.

Three implementation options were evaluated:

### Option A: React island(s)

Add `@astrojs/react` and implement interactivity as React components hydrated with `client:load`. Familiar ergonomics for React-proficient developers; strong ecosystem for accessibility utilities.

Rejected for the following reasons:

- React runtime is approximately 45 KB gzipped. For a static spec viewer where the interactive surface is two IntersectionObservers, a dropdown, and a menu toggle, this is an order-of-magnitude overweight dependency.
- Astro's island hydration adds a coordination layer (hydration scripts, component wrappers) that is architecturally disproportionate to a menu button and a scroll spy.
- The spec site explicitly targets zero framework dependencies in its design. Adding React for scroll spy would be inconsistent with the rest of the architecture (no Tailwind, no Starlight, plain CSS).

### Option B: Svelte island(s)

Add `@astrojs/svelte` and implement interactivity as Svelte components. Svelte compiles to smaller output than React — runtime overhead is approximately 2-5 KB.

Rejected for similar reasons, though the weight argument is weaker. The primary objection is that Svelte's reactive model is designed for state-driven UI — form inputs, live data, component trees. Scroll spy is a DOM observation task, not a state management task. Svelte's stores and bindings add a conceptual layer that does not map cleanly onto `IntersectionObserver` callbacks that imperatively update CSS classes. The code is not simpler to write or read in Svelte than in vanilla DOM APIs for this use case.

Additionally, introducing Svelte creates a second component authoring model in a monorepo that uses React elsewhere (dice-ui, component-library). A one-off Svelte dependency in `apps/spec/` is harder to justify to contributors than "this app uses no framework."

### Option C: Vanilla TypeScript in Astro `<script>` blocks

Write the scroll spy, version switcher, and mobile menu as TypeScript inside Astro component `<script>` blocks. Astro compiles these at build time using its internal bundler (Vite), deduplicated and bundled into the final HTML. The result is approximately 2 KB of JavaScript, no framework runtime, no hydration lifecycle.

The browser APIs required are:

- `IntersectionObserver` — for scroll spy section detection. Supported by all modern browsers (>97% global coverage as of 2026).
- `history.replaceState` — reserved for future use (version switching now uses page navigation per ADR-016).
- `document.querySelector` / `classList` / `hidden` — for DOM manipulation.
- `matchMedia` / resize listener — for responsive breakpoint detection (hamburger menu visibility).

None of these require a framework abstraction. They are stable, well-documented browser APIs.

## Decision

All client-side interactivity in `apps/spec/` is implemented as vanilla TypeScript inside Astro `<script>` blocks. No React, Svelte, Vue, or other component framework is added as a dependency.

The interactivity is co-located with the component that owns the relevant DOM:

- `SidebarNav.astro` — contains the scroll spy script for left sidebar active-section highlighting. Sets up one `IntersectionObserver` on all `##` heading elements. When a heading enters or exits the viewport, the corresponding sidebar link receives the active state (`aria-current="true"` + cyan highlight class).
- `OnThisPage.astro` — contains the right TOC scroll spy script. Observes `##` headings to determine the active section; when the active section changes, repopulates the right TOC with that section's `###`/`####` headings. Also observes those sub-headings to highlight the one closest to the top of the viewport.
- `VersionDropdown.astro` — renders version links as `<a>` tags pointing to `/v/X.Y/`. No client-side JS needed (per ADR-016 amendment — versioning uses standard page navigation).
- `MobileMenu.astro` — contains the hamburger menu open/close script. Manages `aria-expanded` state, focus trap, outside-tap detection.

Scripts inside Astro `<script>` blocks are compiled by Vite at build time. They are TypeScript (strict mode, matching the monorepo's `tsconfig.json` conventions). They are not standalone modules and do not have `export` statements — they run as IIFE-style scripts in the page context.

The total compiled JS output for all interactivity is targeted at under 3 KB gzipped.

### IntersectionObserver thresholds

The scroll spy uses `{ threshold: 0, rootMargin: '-10% 0px -80% 0px' }` — a narrow band near the top of the viewport. A section becomes "active" when its heading crosses into this band from below. This produces stable active-section detection without flicker when the user is between sections.

### Reduced motion

All smooth scroll behavior (sidebar link clicks, in-page anchor navigation) respects `prefers-reduced-motion`. When the media query matches, `scrollIntoView({ behavior: 'smooth' })` is replaced with `scrollIntoView({ behavior: 'instant' })`.

## Consequences

### Positive

- Zero framework runtime overhead. The page ships approximately 2-3 KB of bundled JS for all interactive behavior. This is the minimum possible for this feature set using browser-native APIs.
- No hydration lifecycle. Astro's `<script>` blocks run after the DOM is ready, with no framework mount/unmount to reason about. The interaction model is: DOM is there, script runs, observers attach.
- No new package dependencies beyond Astro itself. `apps/spec/package.json` has no `@astrojs/react`, `@astrojs/svelte`, or similar.
- Maintenance surface is small and self-contained. Each component's interactive logic lives in the same file as its markup. A contributor can read `SidebarNav.astro` and understand both the HTML structure and the scroll spy behavior in one file.
- The vanilla TS approach is readable and auditable for developers who are not familiar with any particular component framework. `IntersectionObserver` is MDN-documented and widely understood.

### Negative

- More verbose than equivalent React or Svelte code for stateful UI. A menu toggle that a React developer would write in five lines of JSX with `useState` requires explicit DOM manipulation, `getAttribute`/`setAttribute` calls, and manual event listener cleanup. This is acceptable for the small scope of interactivity here; it would not scale to a complex application.
- No component encapsulation or reactivity system. If the spec site's interactivity grows significantly (live search, filter panels, interactive examples), vanilla DOM scripting becomes harder to maintain than a component model. At that point this decision should be revisited. The migration path is clear: add an Astro integration and convert the `<script>` blocks to component islands incrementally.
- TypeScript type safety in Astro `<script>` blocks is partial. Astro's bundler compiles them, but `querySelector` results are typed as `Element | null` by the DOM lib, requiring null checks. There is no stronger typing for custom `data-*` attributes. This is a standard vanilla DOM TypeScript limitation, not specific to Astro.

## References

- Design spec: `docs/superpowers/specs/2026-03-20-spec-site-design.md` — tech stack section
- ADR-016: Static Version Embedding — the version-switching script is part of the client JS described in this ADR
- MDN: IntersectionObserver API — `https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver`
- Astro docs: Scripts and event handling — `https://docs.astro.build/en/guides/client-side-scripts/`
