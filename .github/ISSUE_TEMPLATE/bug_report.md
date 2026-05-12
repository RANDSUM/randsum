---
name: Bug report
about: Report incorrect roll output, notation parsing failures, or game-spec mismatches
title: "[bug] "
labels: bug
assignees: ""
---

**Package and version**
e.g. `@randsum/roller@1.3.0`, `@randsum/games/blades@1.3.0`

**Notation or roll input that reproduces the bug**

```ts
// paste the exact call
roll("4d6L")
```

**Expected output**
What you expected `roll(...)` to return — pool, total, result, modifierLogs, etc.

**Actual output**

```
// paste the actual return value, error message, or stack trace
```

**Environment**

- Runtime: Bun / Node version
- OS: macOS / Linux / Windows
- Bundler (if relevant): esbuild / rollup / webpack / vite

**Additional context**

Anything else that helps — links to the RDN spec section, prior issues, or game-system source material if this is a game-package bug.
