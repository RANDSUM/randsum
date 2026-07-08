# RCA: <one-line incident title>

> Copy this file to `runbooks/incidents/RCA-YYYY-MM-DD-<short-slug>.md` and fill it in.
> One RCA per incident. Link it from the related GitHub issue/PR.

## Summary

- **Date / time (UTC):** <start> – <end>
- **Duration:** <e.g. 42m>
- **Severity:** <SEV1 outage | SEV2 degraded | SEV3 minor>
- **Surface(s) affected:** <randsum.dev | notation.randsum.dev | discord bot | npm package>
- **Author:** <name>
- **Status:** <draft | reviewed | closed>

One-paragraph plain-language description of what users experienced.

## Impact

- Who/what was affected and how (users, requests, rolls, command failures, etc.).
- Quantify if possible (duration, % of traffic, number of affected installs).

## Timeline (UTC)

| Time  | Event                                                                                       |
| ----- | ------------------------------------------------------------------------------------------- |
| HH:MM | First signal / alert / report                                                               |
| HH:MM | Investigation started                                                                       |
| HH:MM | Root cause identified                                                                       |
| HH:MM | Mitigation applied (e.g. Netlify "publish previous deploy" / EAS promote / Render redeploy) |
| HH:MM | Service confirmed healthy                                                                   |

## Root cause

What actually broke and why. Distinguish the trigger (what set it off) from the root cause
(the underlying condition that made it possible).

## Detection

- How was it detected (alert, user report, manual check)?
- Detection gap: how much time between failure and detection? What would have caught it sooner?

## Resolution / mitigation

- The exact rollback/fix steps taken. Reference `apps/DEPLOY.md` for the per-platform
  rollback procedure used.

## Recurrence risk & action items

| Action                  | Owner | Issue/PR | Status |
| ----------------------- | ----- | -------- | ------ |
| <preventive fix>        |       |          |        |
| <detection improvement> |       |          |        |
| <doc/runbook update>    |       |          |        |

## Lessons learned

- What went well.
- What went poorly.
- Where we got lucky.
