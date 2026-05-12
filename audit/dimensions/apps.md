# Apps Audit

_Audited: 2026-05-10_

## Summary

All 5 apps build and have functioning CI. Deployment is automated for expo (EAS) and both Astro sites (Netlify). The discord bot has no auto-deploy — Railway is documented but not configured in the repo. The overall build/test posture is solid; the main quality gaps are (a) test-vs-implementation drift in expo, (b) phantom flags in the CLI README, (c) unused dependencies in expo, (d) the spec site still on a draft version that contradicts the "v1.0 conformant" claims made in other READMEs, and (e) the discord bot never being submitted to bot directories despite that being the P0 blocker for #939.

---

## Findings

### F1. cli: README documents `-i` / `--interactive` flag that does not exist — P1

**Observation:** `apps/cli/README.md` lines 38-39 document `randsum -i` and `randsum --interactive` as explicit flags to launch TUI mode. `apps/cli/src/index.ts` contains no such flags — the only way to enter TUI mode is to pass zero arguments. The help text (line 8-28) also omits any `-i` flag.
**Why it matters:** A published npm package (`@randsum/cli` v1.3.0) with a README that describes non-existent flags damages user trust and generates support issues. Users trying `randsum -i` will get a "notation not found" error or silently enter one-shot mode.
**Recommendation:** Remove `-i`/`--interactive` from the README, or implement the flag in `parseArgs()` (trivial — just set a `interactive: boolean` that triggers the `render()` path). The implementation side is S effort; the README fix is trivial.
**Effort:** XS (README fix only) / S (implement the flag)

---

### F2. cli: No stdin/pipe support, no non-zero exit code on error — P2

**Observation:** `apps/cli/src/index.ts` has no `process.stdin` handling. `apps/cli/src/simple/run.ts` catches errors and emits them as text lines on stdout (line 39: `lines.push(\`Error: ...\`)`), with no `process.exit(1)`. The binary therefore always exits 0, even on invalid notation.
**Why it matters:** A CLI tool used in scripts (e.g. `randsum 4d6L --json | jq '.total'`) should exit non-zero on failure so shell scripts can detect errors. Piping is a common use case the docs already hint at (the `jq`example in the CLI docs page).
**Recommendation:** Add`process.exit(1)`when any roll throws. Consider reading from stdin when no notation args are passed and stdin is not a TTY (enables`echo "4d6L" | randsum`).
**Effort:** S

---

### F3. expo: IndexScreen tests assert layout elements (`testID="desktop-two-col"`, `<details>`, `<summary>`) that do not exist in the current implementation — P0

**Observation:** `apps/expo/__tests__/IndexScreen.test.tsx` has 10 layout tests that look for `testID="desktop-two-col"` (lines 200-240), a `<details>` element (lines 255-276), and a `<summary>` element with children `"Notation Reference"` (lines 261-269). None of these are present in `apps/expo/app/index.tsx`. The current component uses a plain conditional `isDesktop` branch with no `testID`, no `<details>`, no `<summary>`.
**Why it matters:** These tests will fail at runtime, meaning CI is either not running expo tests or this file is excluded. The tests describe a more accessible mobile layout (a collapsible `<details>` for the reference grid) that was never implemented. The CI workflow (`ci.yml`) has no expo job — expo is only built/deployed on push-to-main, never tested in CI.
**Recommendation:** Either implement the layout the tests describe (add `testID`, wrap mobile grid in `<details>`/`<summary>`) or delete the dead tests and document the gap. The former is the right call — the `<details>` pattern is good a11y for mobile. Add expo to the CI test matrix.
**Effort:** M (implement) / XS (delete tests + note gap)

---

### F4. expo: Unused dependencies add bundle weight — P2

**Observation:** `apps/expo/package.json` declares `@expo/vector-icons`, `expo-constants`, `expo-crypto`, and `expo-linking` as production dependencies. A search of all source files under `app/`, `components/`, `hooks/`, and `lib/` finds zero imports of any of these four packages. `expo-sqlite` is imported only in `lib/storage.native.ts`, which is never wired into any screen or store.
**Why it matters:** Unused dependencies inflate the install graph and native bundle. `@expo/vector-icons` alone (~14 MB of font assets) is particularly heavy for a native build. `expo-sqlite` with an unconnected storage layer is dead code that misleads future developers.
**Recommendation:** Remove `@expo/vector-icons`, `expo-constants`, `expo-crypto`, and `expo-linking` from `package.json`. For `expo-sqlite`: either wire `storage.native.ts` into a history/templates feature (which matches PRD intent) or remove the file until the feature is scoped.
**Effort:** XS (remove deps) / M (wire SQLite storage)

---

### F5. expo: Native app has no CI test job and no App Store submission — P1

**Observation:** The CI workflow (`ci.yml`) has no expo job. The native deploy workflow (`expo-native-deploy.yml`) triggers on push to `main` and runs EAS `build --profile production` for both iOS and Android — but there is no submission step (`eas submit`). The `eas.json` presumably exists but no App Store Connect or Google Play credentials are documented anywhere in the repo. The PRD lists App Store + Google Play as targets.
**Why it matters:** EAS builds run on every main push, but builds are not submitted to any store. The iOS and Android apps exist only as EAS artifacts, not as published apps users can install. Given the P0 issue (#939) is about the discord bot needing directory submissions, the expo native situation is analogous — running but not shipped.
**Recommendation:** Add `eas submit` steps to the native deploy workflow (requires App Store Connect API key and Google Play service account). Or gate native builds behind a manual workflow trigger until store submission is ready, to avoid wasting EAS build minutes.
**Effort:** M

---

### F6. discord-bot: No automated deployment; Railway documented but not configured in repo — P1

**Observation:** The discord bot has no deployment automation in `.github/workflows/`. The README (`apps/discord-bot/README.md`, lines 152-248) provides extensive Railway deployment instructions referencing a `railway.json` file, but that file does not exist in `apps/discord-bot/`. The bot is live (oauth link in LISTING.md works) but deployment is entirely manual.
**Why it matters:** Manual deploys mean a code change (new command, bug fix) requires a human to SSH somewhere and rebuild. For a P0 epic (#939 — just needs directory submissions), having no automated deploy path is a maintenance risk. The missing `railway.json` also means anyone following the README will hit an error.
**Recommendation:** Either add a `railway.json` (simple: `{"build": {"buildCommand": "bun install && bun run build"}, "deploy": {"startCommand": "node dist/index.js"}}`) and a GitHub Actions deploy job, or remove the Railway section from the README and document the actual hosting setup.
**Effort:** S

---

### F7. discord-bot: All game commands respond publicly; no ephemeral option for private rolls — P2

**Observation:** Every command handler calls `interaction.deferReply()` (default is public) and `interaction.editReply()` with no `flags: [MessageFlags.Ephemeral]`. The error path in `interactionCreate.ts` (line 36-38) does use `Ephemeral` — but only for internal errors, not for user-requested privacy. No command offers an `ephemeral` boolean option.
**Why it matters:** Dice rolls are often intended to be private (the GM rolling secretly, a player rolling without metagame influence). Standard dice bots typically offer at least a `private: true` option. This is a user-facing feature gap that will come up in any directory listing review.
**Recommendation:** Add an optional `hidden: boolean` option to at least `/roll` and the game commands. When `true`, pass `{ flags: [MessageFlags.Ephemeral] }` to `deferReply`.
**Effort:** S

---

### F8. rdn: Only one spec version (v0.9.0 Draft); READMEs claim "RDN v1.0 Level 4 Conformant" — P1

**Observation:** `apps/rdn/src/content/specs/` contains only `v0.9.0.md`, which has `Status: Draft`. The memory notes a `jarvis/spec` branch with a v1.0 notation spec. Meanwhile, `apps/cli/README.md` (line 10) and `apps/discord-bot/README.md` (line 5) both claim `RDN v1.0 Level 4 (Full) Conformant`. The rdn conformance vectors file is `public/conformance/v0.9.0.json`.
**Why it matters:** Claiming conformance to a version that does not yet exist as a published spec is a credibility problem. If the spec site is the source of truth for conformance, the claim must match the published version. The discord bot LISTING.md (the directory submission content) also references conformance.
**Recommendation:** Either (a) land the v1.0 spec on `jarvis/spec` into main and publish it as `v1.0.0.md` in rdn, or (b) change the README conformance claims to `RDN v0.9.0 Level 4`. Option (b) is trivially fast; option (a) is the right long-term answer.
**Effort:** XS (change READMEs) / M (publish v1.0 spec)

---

### F9. rdn: Zero tests; conformance vectors are generated but not validated at test time — P2

**Observation:** `apps/rdn/package.json` has no `test` script and no test files anywhere in `apps/rdn/`. The `conformance-gen.ts` script generates `public/conformance/v0.9.0.json`, and there is a `conformance:check` script that diffs the output — but this only runs in CI for the `rdn` job, not as a separate test stage. The spec content itself (a ~1300-line Markdown document) has no automated accuracy checks against the roller implementation.
**Why it matters:** The spec site is the authoritative reference for third-party implementors. If the spec diverges from the roller's actual behavior, conformance vectors will be wrong and external implementors will build broken software. For a spec targeting potential IETF submission (per the document itself), this is a credibility gap.
**Recommendation:** Add a test script that (1) loads conformance vectors and (2) runs each vector through `@randsum/roller` and asserts the output matches the expected value. This is a direct contract test between the spec and the implementation.
**Effort:** M

---

### F10. site: `prefetch: false` is a blanket workaround, not a targeted fix — P3

**Observation:** `apps/site/astro.config.mjs` line 184 sets `prefetch: false`. The memory notes this "fixes dev server hydration bug." Starlight's prefetching is a performance feature; disabling it globally means no page-to-page transitions prefetch in production, hurting perceived navigation speed.
**Why it matters:** For a documentation site, fast page navigation is a core UX feature. Starlight's prefetch is typically enabled by default and improves LCP on subsequent pages. The comment in memory says "dev server hydration bug" — this suggests the bug may be specific to dev mode and the fix may have been overly broad.
**Recommendation:** Investigate whether the hydration bug still occurs in the current Starlight/Astro version. If it only affects dev, use `prefetch: { defaultStrategy: 'hover', ignoreSlowConnection: true }` in production and only disable in dev. If the bug is reproducible, file an issue upstream.
**Effort:** S

---

### F11. site: `og:image` references `randsum.dev/og-image.svg` but no Twitter/OG `type=image/svg+xml` MIME hint — P3

**Observation:** `apps/site/src/components/Head.astro` and `apps/expo/app/_layout.tsx` both use `https://randsum.dev/og-image.svg` as the OG image. Twitter cards and most OG consumers expect PNG/JPG — SVG is not universally supported by social platform scrapers (Twitter/X, Slack, Discord all render blank for SVG og:image). The site `public/` directory has `og-image.svg` but no rasterized version.
**Why it matters:** Every share of the playground URL or site URL on social media produces a blank image card instead of a branded preview. Discord (ironic, given the bot) does not render SVG og:images.
**Recommendation:** Export `og-image.svg` to `og-image.png` (1200x630) and update the `og:image` reference in Head.astro, expo \_layout.tsx, and rdn SpecLayout.astro.
**Effort:** XS

---

### F12. discord-bot: README `Adding New Commands` section is stale — mentions editing `src/index.ts` — P3

**Observation:** `apps/discord-bot/README.md` lines 122-128 instructs developers to "Import and register it in `src/index.ts`" and "Import and add it to `src/deploy-commands.ts`" as separate steps. The refactor documented in CLAUDE.md (commit `672890c6`) consolidated this into the `src/commands/index.ts` barrel — `src/index.ts` and `src/deploy-commands.ts` both import only from the barrel. The process now requires editing only `src/commands/index.ts`.
**Why it matters:** A developer following the README will modify the wrong files, get confused when the pattern doesn't match the actual code, and may introduce duplicate registrations or miss the barrel entirely.
**Recommendation:** Update the "Adding New Commands" section in README.md to reflect the current pattern: only `src/commands/<name>.ts` and `src/commands/index.ts` need changing. The CLAUDE.md is already correct.
**Effort:** XS
