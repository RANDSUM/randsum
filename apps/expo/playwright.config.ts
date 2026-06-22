import { defineConfig, devices } from '@playwright/test'

// Playwright smoke test for the Expo WEB build (X1b).
//
// What's REAL: this boots the actual exported production web bundle (apps/expo/dist,
// produced by `expo export --platform web`) via a static server, loads it in a real
// headless Chromium, types/seeds a notation, clicks the real "Roll the dice" button, and
// asserts the real result dialog renders a total. No mocking of the roll path.
//
// What's a PREREQUISITE (documented, not stubbed): you must build the web bundle and have
// Playwright's browser installed first:
//
//   bun run --filter @randsum/roller build
//   cd apps/expo && bunx expo export --platform web
//   bunx playwright install chromium
//   bun run --filter @randsum/expo test:e2e
//
// `@playwright/test` is a devDependency of this app. It is intentionally NOT wired into the
// default `bun test` run (which uses bun:test) so CI doesn't pull a browser unless the e2e
// job opts in.
const PORT = 8099

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `bun run e2e/serve.ts`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
    env: { PORT: String(PORT) }
  }
})
