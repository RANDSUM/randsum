# Expo web e2e (Playwright)

A browser smoke test for the Expo **web** build (audit item X1b): boot the real exported web
bundle, perform one roll, assert the result renders.

## What is REAL (not stubbed)

- The test runs against the **actual production web bundle** produced by
  `expo export --platform web` (`apps/expo/dist`), served as static files — not a dev server.
- It loads in a **real headless Chromium** via Playwright.
- It drives the **real UI**: types/seeds notation (`?n=4d6L`), clicks the real
  "Roll the dice" button from `@randsum/dice-ui`'s `NotationRoller`, and asserts the real
  result dialog renders a numeric total within the valid range for `4d6L` (3–18).
- The roll path is **not mocked** — it executes `@randsum/roller` in the browser.

## Prerequisites (documented, not stubbed)

`@playwright/test` is a devDependency of `@randsum/expo`, but the browser binary and the web
build are not produced automatically by the default `bun test` (which uses `bun:test`). The
e2e is intentionally a separate opt-in target so CI does not pull a browser unless an e2e job
asks for it.

To run locally:

```bash
# 1. roller must be built (workspace source resolution for the export)
bun run --filter @randsum/roller build

# 2. produce the web bundle (apps/expo/dist)
bun run --filter @randsum/expo e2e:build      # = expo export --platform web

# 3. install the Playwright browser once
cd apps/expo && bunx playwright install chromium

# 4. run the smoke test (Playwright boots a static server for dist/ automatically)
bun run --filter @randsum/expo test:e2e
```

## Files

- `playwright.config.ts` — testDir `e2e/`, matches `*.e2e.ts`, boots `e2e/serve.ts` as the web server.
- `e2e/serve.ts` — minimal Bun static server for `apps/expo/dist` (SPA fallback to `index.html`).
- `e2e/roll.e2e.ts` — the smoke test.

Artifacts (`test-results/`, `playwright-report/`, `dist/`) are git-ignored.
