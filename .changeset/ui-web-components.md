---
'@randsum/ui': minor
---

First release of `@randsum/ui`: the RANDSUM roller as Web Components, built
with Lit. `<randsum-roller>` (`@randsum/ui/roller`) is the whole roller in one
element, with `size="mini"`, `"compact"` (the default) or `"max"`. Every part
is its own element and entry (`/notation-field`, `/roll-button`,
`/status-line`, `/key-pad`, `/preset-list`, `/readout`, `/roll-steps`), and
`<randsum-scope>` (`/scope`) gives the parts inside it one shared state with no
script. Styles live in each element's Shadow DOM and are themed with
`--rsui-*` custom properties set on any ancestor. Thin wrappers ship for React
(`/react/*`, React 18 and 19) and Vue (`/vue/*`, with `v-model`), and
`/svelte` types the tags for Svelte 5, and `/ssr` renders the elements on
the server as Declarative Shadow DOM so they show before any script runs; plain HTML, htmx and Astro use the tags
directly. `/roller-state`, `/keys`, `/presets` and `/check` are the
framework-free state, keys, presets and notation check.
