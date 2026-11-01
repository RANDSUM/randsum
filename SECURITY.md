# Security Policy

## Supported Versions

RANDSUM ships as scoped packages under `@randsum/*`. Version 5.0.0 of the roller and games is a fresh release line; only the versions below receive fixes.

| Package                  | Supported version | Notes                                               |
| ------------------------ | ----------------- | --------------------------------------------------- |
| `@randsum/roller`        | 5.x               | Core dice engine. Version-linked with games         |
| `@randsum/games`         | 5.x               | Game interpretations. Version-linked with roller    |
| `@randsum/mcp`           | 2.x               | MCP server; bundles roller and games                |
| `@randsum/ui`            | 0.x               | Roller Web Components                               |
| `@randsum/notation-spec` | 0.1.x             | Notation spec, conformance vectors and runner       |

Security patches land on the latest minor of each supported major; older minors are not backported.

## Reporting a Vulnerability

If you find a vulnerability, let me know — either open a PR, file a private security advisory at https://github.com/RANDSUM/randsum/security/advisories, or email me at alxjrvs [@t] gmail [.] com. I'll aim to acknowledge reports within 7 days and ship a fix in the next patch release for the affected package.
