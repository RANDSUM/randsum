# Security Policy

## Supported Versions

RANDSUM is now distributed as scoped packages under `@randsum/*`. The legacy unscoped `randsum` package (1.x–3.x) is no longer maintained.

| Package           | Supported version | Notes                                              |
| ----------------- | ----------------- | -------------------------------------------------- |
| `@randsum/roller` | ≥ 1.3.0           | Core dice engine. Patches land on the latest minor |
| `@randsum/games`  | ≥ 1.3.0           | Game packages. Bumps in lockstep with roller       |
| `@randsum/cli`    | ≥ 1.3.0           | CLI binary. Bumps in lockstep with roller          |
| `randsum` (≤ 3.x) | :x:               | Legacy monolithic package, unsupported             |

## Reporting a Vulnerability

If you find a vulnerability, let me know — either open a PR, file a private security advisory at https://github.com/RANDSUM/randsum/security/advisories, or email me at alxjrvs [@t] gmail [.] com. I'll aim to acknowledge reports within 7 days and ship a fix in the next patch release for the affected package.
