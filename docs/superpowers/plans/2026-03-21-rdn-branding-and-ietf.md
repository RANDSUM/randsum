# RDN Branding, IETF Compliance, and Cross-Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish "RDN" (RANDSUM Dice Notation) as a consistent brand across the entire monorepo, add IETF-required sections to the spec, fix broken references, add conformance claims, and create cross-linking between all public-facing properties.

**Architecture:** Four workstreams: (1) IETF spec compliance, (2) RDN branding standardization, (3) cross-linking between properties, (4) broken reference cleanup. All changes are docs/content — no runtime code changes.

**Tech Stack:** Markdown, Astro (MDX for site, `.astro` for RDN site), package.json metadata

---

## File Map

### Spec (IETF compliance)
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md` — add Abstract, Security Considerations, IANA Considerations, References, Authors, RFC 8174 reference

### RDN Branding (all public-facing files)
- Modify: `README.md` (root)
- Modify: `packages/roller/README.md`
- Modify: `packages/games/README.md`
- Modify: `apps/cli/README.md`
- Modify: `apps/discord-bot/README.md`
- Modify: `packages/roller/package.json` (description field)
- Modify: `packages/games/package.json` (description field)
- Modify: `apps/cli/package.json` (description field)
- Modify: `apps/discord-bot/src/commands/notation.ts` (casing fix)

### Cross-Linking
- Modify: `apps/rdn/src/components/HeroHeader.astro` — add links to randsum.dev and playground
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md` — add ecosystem URLs
- Modify: `apps/playground/src/components/PlaygroundHeader.tsx` — add links to docs and spec
- Modify: `apps/site/astro.config.mjs` — sidebar label consistency

### Docs Site (conformance claims + RDN terminology)
- Modify: `apps/site/src/content/docs/roller/introduction.mdx`
- Modify: `apps/site/src/content/docs/games/introduction.mdx`
- Modify: `apps/site/src/content/docs/notation/introduction.mdx`
- Modify: `apps/site/src/content/docs/notation/randsum-dice-notation.mdx`
- Modify: `apps/site/src/content/docs/welcome/ecosystem-overview.mdx`

### Broken Reference Cleanup
- Modify: `llms.txt` (root)
- Modify: `CONTRIBUTING.md`

---

## Task 1: IETF — Add Abstract and Document Metadata

**Files:**
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md:1-8`

- [ ] **Step 1: Add Abstract before Section 1**

Insert after the frontmatter header block (after the `---` on line 7) and before `## 1. Introduction`:

```markdown
## Abstract

This document defines the RANDSUM Dice Notation (RDN), a human-readable, machine-parseable format for expressing dice rolls in tabletop role-playing games. RDN specifies a three-stage execution pipeline with deterministic modifier ordering, a faceted classification system for modifiers, and four conformance levels for partial implementation. The notation supports standard dice, custom faces, geometric dice, draw dice, and 26 modifiers across three pipeline stages. This specification is intended to enable interoperable dice notation processing across virtual tabletop platforms, chat bots, and game automation tools.

**Document Information:**
- **Authors:** Alex Jarvis (alxjrvs@gmail.com)
- **Project:** https://github.com/RANDSUM/randsum
- **Specification Site:** https://notation.randsum.dev
- **Documentation:** https://randsum.dev
- **Playground:** https://playground.randsum.dev
```

- [ ] **Step 2: Update RFC 2119 reference to include RFC 8174**

Find line 31 (the RFC 2119 boilerplate in Section 1.3) and replace:

Old: `The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.txt).`

New: `The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals, as shown here.`

- [ ] **Step 3: Verify build**

Run: `bun run --filter '@randsum/rdn' build`
Expected: 3 pages built, no errors

- [ ] **Step 4: Commit**

```bash
git add apps/rdn/src/content/specs/v1.0-alpha.md
git commit -m "feat(spec): add Abstract, author info, ecosystem URLs, RFC 8174 reference"
```

---

## Task 2: IETF — Add Security Considerations Section

**Files:**
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md` — add after Section 9.5 (Error Semantics)

- [ ] **Step 1: Add Security Considerations section**

Insert as a new `### 9.6 Security Considerations` after the Error Semantics section:

```markdown
### 9.6 Security Considerations

RDN notation strings MAY originate from untrusted sources (user input, network messages, database records). Implementations MUST consider the following security implications:

**Denial of Service:** Crafted notation can cause excessive computation. The explosion depth cap (Section 9.1), geometric die iteration cap (Section 9.2), and reroll attempt cap (Section 9.3) provide baseline protection, but implementations SHOULD impose additional limits on:
- Total pool size (number of dice across all pools)
- Repeat operator count (`xN` — large N values generate many independent evaluations)
- Input string length

**Input Validation:** Implementations MUST validate notation strings before execution. Notation strings MUST NOT be interpolated into shell commands, SQL queries, or other injection-susceptible contexts without proper escaping. The annotation feature (`[text]`) permits arbitrary text content — implementations that display annotations MUST sanitize them against cross-site scripting (XSS) if rendered in HTML contexts.

**Resource Exhaustion:** Implementations SHOULD set timeouts on notation evaluation to prevent unbounded computation from blocking other operations.
```

- [ ] **Step 2: Verify build**

Run: `bun run --filter '@randsum/rdn' build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/rdn/src/content/specs/v1.0-alpha.md
git commit -m "feat(spec): add Security Considerations section (9.6)"
```

---

## Task 3: IETF — Add IANA Considerations and References Sections

**Files:**
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md` — add before the Appendices

- [ ] **Step 1: Add IANA Considerations section**

Add as a new top-level section after Conformance Levels (Section 10) and before Appendix A:

```markdown
## 11. IANA Considerations

This document has no IANA actions at this time. A future version of this specification MAY register a media type for RDN notation strings (e.g., `text/x-dice-notation`) if protocol-level identification becomes necessary.

## 12. References

### 12.1 Normative References

- **[BCP14]** Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997; Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017.

### 12.2 Informative References

- **[ROLL20]** Roll20 Virtual Tabletop, "Dice Reference", https://wiki.roll20.net/Dice_Reference
- **[FOUNDRYVTT]** Foundry Virtual Tabletop, "Dice", https://foundryvtt.com/article/dice/
- **[AVRAE]** Avrae Discord Bot, "Dice Syntax", https://avrae.readthedocs.io/en/latest/cheatsheets/dice_reference.html
```

- [ ] **Step 2: Verify build**

Run: `bun run --filter '@randsum/rdn' build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/rdn/src/content/specs/v1.0-alpha.md
git commit -m "feat(spec): add IANA Considerations and References sections"
```

---

## Task 4: IETF — Remove Dangling Implementation Reference

**Files:**
- Modify: `apps/rdn/src/content/specs/v1.0-alpha.md`

- [ ] **Step 1: Find and fix the dangling reference**

Search for `packages/roller/RANDSUM_DICE_NOTATION.md` in the spec. Replace with a self-contained reference:

Old: `The full syntax guide with examples is maintained separately (see packages/roller/RANDSUM_DICE_NOTATION.md in the reference implementation).`

New: `The full syntax is defined in this specification. For a practical guide with interactive examples, see https://randsum.dev/notation/randsum-dice-notation/.`

- [ ] **Step 2: Verify build**

Run: `bun run --filter '@randsum/rdn' build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/rdn/src/content/specs/v1.0-alpha.md
git commit -m "fix(spec): replace dangling implementation file reference with stable URL"
```

---

## Task 5: Fix Root llms.txt Broken References

**Files:**
- Modify: `llms.txt` (root)

- [ ] **Step 1: Rewrite llms.txt**

Replace the entire contents with:

```
# RANDSUM - Dice Notation and Rolling Engine

> TypeScript dice engine implementing the RANDSUM Dice Notation (RDN) specification. RDN v1.0 Level 4 (Full) Conformant. Works with D&D 5e, Blades in the Dark, PbtA, Daggerheart, Root RPG, Salvage Union, and more.

## Packages

- @randsum/roller - Core dice engine with built-in RDN notation parser
- @randsum/games - TTRPG game packages with subpath exports:
  - @randsum/games/fifth - D&D 5th Edition
  - @randsum/games/blades - Blades in the Dark
  - @randsum/games/pbta - Powered by the Apocalypse
  - @randsum/games/daggerheart - Daggerheart RPG
  - @randsum/games/root-rpg - Root RPG
  - @randsum/games/salvageunion - Salvage Union

## Quick Start

npm install @randsum/roller

roll() accepts number, notation string, options object, or multiple arguments:

roll(20)       // Number: 1d20
roll("4d6L")   // Notation: D&D ability score (4d6, drop lowest)
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
roll("2d20L+5") // Advantage attack roll
roll("2d6+3")   // PbtA / 2d6 + stat
roll("d%")      // Percentile: 1d100
roll("4dF")     // Fate Core: 4 Fate dice (-4 to +4)
roll("5d6W")   // D6 System wild die
roll("g6")     // Geometric die
roll("3DD6")   // Draw die
roll("4d6Lx6") // Repeat operator
roll("2d6+3[fire]") // Annotations

## Links

- Documentation: https://randsum.dev
- RDN Specification: https://notation.randsum.dev
- Playground: https://playground.randsum.dev
- GitHub: https://github.com/RANDSUM/randsum
- RDN Spec (full text): https://notation.randsum.dev/llms-full.txt
```

- [ ] **Step 2: Commit**

```bash
git add llms.txt
git commit -m "fix: rewrite root llms.txt with RDN branding and correct links"
```

---

## Task 6: Fix CONTRIBUTING.md Stale Reference

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Find and fix stale packages/notation reference**

Search for `packages/notation` in CONTRIBUTING.md. It should reference the current structure. Replace the stale entry with the correct one. Also add an "RDN" reference:

Find the project structure section listing `packages/notation/` and replace with `packages/games/` or remove if already listed. Add a reference to the RDN spec:

Add near the "useful links" or bottom section:
```markdown
- [RANDSUM Dice Notation (RDN) Specification](https://notation.randsum.dev) — the formal spec for dice notation syntax
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "fix: remove stale packages/notation reference, add RDN spec link"
```

---

## Task 7: RDN Branding — Root README

**Files:**
- Modify: `README.md` (root)

- [ ] **Step 1: Add RDN conformance badge and spec link**

Near the top (after the project description/badges), add:

```markdown
**RDN v1.0 Level 4 (Full) Conformant** — implements the complete [RANDSUM Dice Notation Specification](https://notation.randsum.dev)
```

Find any reference to "Dice Notation and Rolling Engine" and ensure it stays as the tagline but add "RDN" context. In the links/resources section at the bottom, ensure these links exist:

```markdown
- [RANDSUM Dice Notation (RDN) Specification](https://notation.randsum.dev)
- [Documentation](https://randsum.dev)
- [Playground](https://playground.randsum.dev)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "feat: add RDN conformance claim and spec link to root README"
```

---

## Task 8: RDN Branding — Roller README + package.json

**Files:**
- Modify: `packages/roller/README.md`
- Modify: `packages/roller/package.json`

- [ ] **Step 1: Add RDN conformance to roller README**

Near the top of the roller README, add:

```markdown
**RDN v1.0 Level 4 (Full) Conformant** — implements the complete [RANDSUM Dice Notation (RDN) Specification](https://notation.randsum.dev)
```

Rename the "Notation Reference" section header to "RDN Reference" or "RANDSUM Dice Notation Reference".

- [ ] **Step 2: Update package.json description**

Change the `description` field in `packages/roller/package.json` to include "RDN":

```json
"description": "TypeScript dice engine implementing the RANDSUM Dice Notation (RDN) specification for tabletop RPGs"
```

- [ ] **Step 3: Commit**

```bash
git add packages/roller/README.md packages/roller/package.json
git commit -m "feat(roller): add RDN conformance claim and update description"
```

---

## Task 9: RDN Branding — Games README + package.json

**Files:**
- Modify: `packages/games/README.md`
- Modify: `packages/games/package.json`

- [ ] **Step 1: Add RDN reference to games README**

Add near the top:

```markdown
Built on `@randsum/roller`, which is **RDN v1.0 Level 4 (Full) Conformant**. All game packages use [RANDSUM Dice Notation (RDN)](https://notation.randsum.dev) for dice mechanics.
```

Also fix the Blades pool description if it says "0-10d6" — change to "0-4d6" (max rating is 4).

- [ ] **Step 2: Update package.json description**

```json
"description": "TTRPG game packages using RDN-conformant dice notation for the RANDSUM ecosystem"
```

- [ ] **Step 3: Commit**

```bash
git add packages/games/README.md packages/games/package.json
git commit -m "feat(games): add RDN conformance reference, fix Blades pool range"
```

---

## Task 10: RDN Branding — CLI and Discord Bot

**Files:**
- Modify: `apps/cli/README.md`
- Modify: `apps/discord-bot/README.md`
- Modify: `apps/discord-bot/src/commands/notation.ts`

- [ ] **Step 1: Add RDN reference to CLI README**

Add near the top: `Powered by `@randsum/roller` — **RDN v1.0 Level 4 (Full) Conformant**. See the [RANDSUM Dice Notation Specification](https://notation.randsum.dev).`

- [ ] **Step 2: Add RDN reference to Discord bot README**

Add near the top: same as CLI. Also fix "0-10 dice" for Blades to "0-4 dice".

- [ ] **Step 3: Fix casing in discord bot notation command**

In `apps/discord-bot/src/commands/notation.ts`, find "Randsum Dice Notation Reference" and change to "RANDSUM Dice Notation Reference" (capitalize RANDSUM).

- [ ] **Step 4: Commit**

```bash
git add apps/cli/README.md apps/discord-bot/README.md apps/discord-bot/src/commands/notation.ts
git commit -m "feat(cli,discord): add RDN conformance claims, fix Blades range, fix casing"
```

---

## Task 11: Cross-Linking — RDN Site to Docs and Playground

**Files:**
- Modify: `apps/rdn/src/components/HeroHeader.astro`

- [ ] **Step 1: Add docs and playground links to hero header**

In the `spec-hero-actions` div, add links to randsum.dev and playground.randsum.dev before the GitHub link:

```astro
<a
  href="https://randsum.dev"
  class="spec-hero-github"
  aria-label="Documentation"
  target="_blank"
  rel="noopener noreferrer"
  title="Documentation"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
</a>
<a
  href="https://playground.randsum.dev"
  class="spec-hero-github"
  aria-label="Playground"
  target="_blank"
  rel="noopener noreferrer"
  title="Playground"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
</a>
```

- [ ] **Step 2: Verify build**

Run: `bun run --filter '@randsum/rdn' build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/rdn/src/components/HeroHeader.astro
git commit -m "feat(rdn): add docs and playground links to hero header"
```

---

## Task 12: Cross-Linking — Playground to Docs and Spec

**Files:**
- Modify: `apps/playground/src/components/PlaygroundHeader.tsx`

- [ ] **Step 1: Read PlaygroundHeader.tsx to understand current structure**

Run: `cat apps/playground/src/components/PlaygroundHeader.tsx`

- [ ] **Step 2: Add links to docs and spec**

Add two links (to `https://randsum.dev` and `https://notation.randsum.dev`) in the header area. Follow the existing link pattern in the component.

- [ ] **Step 3: Verify build**

Run: `bun run --filter '@randsum/playground' build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/playground/src/components/PlaygroundHeader.tsx
git commit -m "feat(playground): add links to docs site and RDN spec"
```

---

## Task 13: Docs Site — RDN Terminology and Conformance Claims

**Files:**
- Modify: `apps/site/src/content/docs/roller/introduction.mdx`
- Modify: `apps/site/src/content/docs/games/introduction.mdx`
- Modify: `apps/site/src/content/docs/notation/introduction.mdx`
- Modify: `apps/site/src/content/docs/welcome/ecosystem-overview.mdx`
- Modify: `apps/site/astro.config.mjs`

- [ ] **Step 1: Add conformance claim to roller introduction**

Near the top of `roller/introduction.mdx`, add:

```markdown
:::tip[RDN Conformant]
`@randsum/roller` is **RDN v1.0 Level 4 (Full) Conformant**, implementing the complete [RANDSUM Dice Notation Specification](https://notation.randsum.dev).
:::
```

- [ ] **Step 2: Add RDN reference to games introduction**

Near the top of `games/introduction.mdx`, add:

```markdown
All game packages are powered by `@randsum/roller`, which implements the full [RANDSUM Dice Notation (RDN) Specification](https://notation.randsum.dev).
```

- [ ] **Step 3: Add "What is RDN?" to notation introduction**

In `notation/introduction.mdx`, add a section explaining RDN:

```markdown
## What is RDN?

**RANDSUM Dice Notation (RDN)** is a formal specification for dice notation syntax used in tabletop RPGs. It defines a three-stage execution pipeline, 26 modifiers, and four conformance levels. The full specification is published at [notation.randsum.dev](https://notation.randsum.dev).

`@randsum/roller` implements the complete RDN specification at **Level 4 (Full) conformance**.
```

- [ ] **Step 4: Add RDN mention to ecosystem overview**

In `welcome/ecosystem-overview.mdx`, mention that the ecosystem is built on the RDN spec.

- [ ] **Step 5: Fix sidebar label consistency**

In `apps/site/astro.config.mjs`, change the sidebar item label from `'Randsum Dice Notation Spec'` to `'RDN Syntax Guide'` to match the page title pattern and use the abbreviation.

- [ ] **Step 6: Verify build**

Run: `bun run --filter '@randsum/site' build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/site/src/content/docs/roller/introduction.mdx \
  apps/site/src/content/docs/games/introduction.mdx \
  apps/site/src/content/docs/notation/introduction.mdx \
  apps/site/src/content/docs/welcome/ecosystem-overview.mdx \
  apps/site/astro.config.mjs
git commit -m "feat(site): add RDN conformance claims, What is RDN section, fix sidebar label"
```

---

## Task 14: Fix Site Priority Table Discrepancy

**Files:**
- Modify: `apps/site/src/content/docs/notation/randsum-dice-notation.mdx`

- [ ] **Step 1: Find the priority table**

Search for the Drop/Keep priority values (20/21) and update to match the spec (65/66). Check all priorities against the spec's Appendix A.

- [ ] **Step 2: Verify build**

Run: `bun run --filter '@randsum/site' build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/site/src/content/docs/notation/randsum-dice-notation.mdx
git commit -m "fix(site): update priority table to match RDN spec Appendix A"
```

---

## Summary

| Task | Priority | Type | Scope |
|------|----------|------|-------|
| T1 | P0 | IETF | Abstract, Author, Ecosystem URLs, RFC 8174 |
| T2 | P0 | IETF | Security Considerations |
| T3 | P0 | IETF | IANA Considerations + References |
| T4 | P0 | IETF | Remove dangling implementation ref |
| T5 | P0 | Cleanup | Fix root llms.txt broken refs |
| T6 | P0 | Cleanup | Fix CONTRIBUTING.md stale ref |
| T7 | P1 | Branding | Root README — RDN conformance |
| T8 | P1 | Branding | Roller README + package.json |
| T9 | P1 | Branding | Games README + package.json |
| T10 | P1 | Branding | CLI + Discord bot |
| T11 | P1 | Cross-link | RDN site → docs + playground |
| T12 | P1 | Cross-link | Playground → docs + spec |
| T13 | P1 | Docs | Site RDN terminology + conformance |
| T14 | P1 | Cleanup | Fix site priority table |
