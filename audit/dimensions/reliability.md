# Reliability

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Summary

This is a zero-runtime-dependency dice-engine monorepo: the publishable packages
(`@randsum/roller`, `@randsum/games`, `@randsum/cli`, `@randsum/dice-ui`) are
pure computation with no network, DB, or queue I/O, so reliability there reduces
to error-surface design and correctness — and on that axis the codebase is
strong. A single coherent error hierarchy (all errors extend `RandsumError`
with stable `code` + structured `context`) spans the ecosystem, `roll()` throws
on invalid input, and consumers narrow with `instanceof`. There are **no empty
or all-swallowing catch blocks** anywhere in non-test source. The only
long-running surface, the `apps/discord-bot` Render worker, has been
deliberately hardened: capped exponential backoff on gateway login, a structured
JSON logger, in-process command metrics with periodic flush, an `unhandledRejection`/
`uncaughtException`/`client.error` safety net, graceful SIGTERM/SIGINT shutdown,
and a pluggable error-tracker seam. The main residual gaps are an **inactive
error tracker** (Sentry seam is a no-op stub, so production exceptions live only
in Render logs), **no health/liveness signal** for a worker that holds a single
gateway connection, **no SLO/SLI or alerting definition**, and **no dedicated
tests** for the load-bearing reliability utilities (backoff, metrics, logger,
error tracker). These are appropriate-to-scale gaps for a hobby-tier single-instance
bot, not latent outages.

**Overall grade:** B

## Framework anchors

- ISO/IEC 25010 §6.2 — Reliability (maturity, availability, fault tolerance, recoverability)
- ISO/IEC 5055 — Reliability rules (error handling, resource handling)
- Google SRE Book — observability, SLO/SLI, error budgets
- OpenTelemetry semantic conventions — metrics / logs / tracing signal shapes
- DORA / Accelerate — change-failure-rate and MTTR as observability-downstream outcomes

## Findings

### F1 — Error tracker is configured but never forwards (no-op Sentry stub)

- **Severity:** Medium
- **Location:** `apps/discord-bot/src/utils/errorTracker.ts:42` (`forwardToSentry` no-op), `:30` (`initErrorTracker`)
- **Evidence:** `captureException` logs a structured `exception.captured` line and, when `SENTRY_DSN` is set, calls `forwardToSentry` — whose body is an empty no-op stub with a comment to swap in `Sentry.captureException`. `@sentry/node` is intentionally not a dependency (bundle-size tradeoff documented in the file header). So even with a DSN configured, exceptions are never delivered to an external tracker; they exist only in Render's log stream.
- **Impact:** No aggregated error inventory, no deduplication, no alert-on-new-exception, no release-regression tracking. MTTR for a recurring bot exception depends entirely on someone manually grepping Render logs. For a single-instance, low-criticality bot this is tolerable, but it means the "error tracker" is presently observability theater unless the stub is wired up.

### F2 — No health / liveness signal for the single-instance gateway worker

- **Severity:** Medium
- **Location:** `apps/discord-bot/src/index.ts` (entry), `render.yaml` (worker blueprint) — absence; grep for `healthz|readyz|healthCheck` across the repo returns nothing
- **Evidence:** The bot is a Render `worker` (not a web service), so Render provides no HTTP health check, and the code exposes none. Liveness is implicit: the process either holds the Discord gateway connection or it has exited. A "zombie" state — process alive but gateway silently disconnected and not reconnecting — would not be detected by the platform. discord.js auto-reconnects internally, but there is no application-level heartbeat, `shardDisconnect`/`shardReconnecting` instrumentation, or watchdog that would surface a stuck connection.
- **Impact:** A silent gateway stall (process up, events not processed) is invisible until a user reports "the bot isn't responding." `numInstances` is correctly pinned to 1 (multiple instances double-process events), which is the right call, but it also means there is no redundancy to mask a stuck instance. Recovery is manual redeploy.

### F3 — No SLO / SLI definitions or alerting

- **Severity:** Medium
- **Location:** across repo — absence (no `slo.yaml`, no error-budget policy, no PagerDuty/Opsgenie/alert wiring)
- **Evidence:** Metrics exist (per-command invocation/error counters flushed every 5 min to a `metrics.flush` log line) and the code comments explicitly anticipate "a future symptom-based alert," but no alert is defined and no target (success rate, latency percentile) is documented. The RCA template (`runbooks/RCA-template.md`) references severity levels (SEV1/2/3) but `runbooks/incidents/` is empty (only `.gitkeep`).
- **Impact:** The team has the raw signal (error counts in logs) to define a symptom-based alert ("command error rate > X%") but has not closed the loop. Without an alert, the metrics flush is forensic-only — useful after an incident is noticed, not for detecting one. Appropriate severity for a hobby bot; would be High for a revenue service.

### F4 — Load-bearing reliability utilities have no dedicated tests

- **Severity:** Medium
- **Location:** `apps/discord-bot/__tests__/` — only command + `guildCreate` event tests; no test references `loginWithBackoff`, `metrics`, `errorTracker`, `logger`, or `interactionCreate`'s error path (grep across `__tests__` returns zero matches)
- **Evidence:** `loginWithBackoff.ts` (retry/backoff loop with an explicitly injectable `sleep` seam — clearly built to be testable), `metrics.ts` (counter/flush/timer lifecycle), `logger.ts` (Error serialization + level routing), and the `interactionCreate` catch/follow-up fallback are the components most likely to fail _during_ an incident, yet none has a unit test. The injectable `sleep`/`options` in `loginWithBackoff` signals test intent that was never realized.
- **Impact:** The code paths that only execute under failure (backoff exhaustion, reply-after-error fallback, metrics flush on shutdown) are exactly the ones least exercised in normal operation, so regressions there ship silently. A future refactor could break the backoff cap or the error-reply fallback without any test catching it.

### F5 — No distributed tracing or request/interaction correlation id

- **Severity:** Low
- **Location:** `apps/discord-bot/src/utils/logger.ts`, `errorTracker.ts`
- **Evidence:** Logs are structured JSON (good) and `captureException` stamps `interactionId`, `command`, `userId`, `guildId`, and a `phase` discriminator onto error lines — so error context is correlatable. But there is no trace-id spanning the full interaction lifecycle (invocation log → execute → reply), no OpenTelemetry/tracing library, and routine (non-error) logs carry no correlation id. For a single-service worker with no downstream calls this is the correct scope — distributed tracing would be over-engineering — but interaction-level correlation on the happy path would aid debugging.
- **Impact:** Minimal at current scale. Reconstructing a single interaction's full flow from logs requires the error path to have fired (only errors carry `interactionId`). Noted for completeness, not a pressing risk.

### F6 — `config.ts` throws at import time on missing env vars (fail-fast, with a restart-loop caveat)

- **Severity:** Low
- **Location:** `apps/discord-bot/src/utils/config.ts:11-17`
- **Evidence:** Missing `DISCORD_TOKEN`/`DISCORD_CLIENT_ID` throws a plain `Error` at module evaluation, before `index.ts`'s `initErrorTracker()` runs. This is correct fail-fast behavior, but a _misconfigured_ (not missing) token surfaces only at `client.login()`, where `loginWithBackoff` (5 attempts, capped 30s) then `process.exit(1)` correctly avoids a tight crash-loop under Render auto-restart. The config-missing path, however, throws before the tracker is initialized, so that specific failure is never captured by `captureException` — only a raw stack on stderr.
- **Impact:** Very low — a missing-env misconfiguration is a deploy-time error caught immediately on first boot, and the stack trace on stderr is sufficient. Noted as a minor asymmetry: the auth-failure path is hardened (backoff + capture), the missing-config path is not. The backoff design (F-positive) is the right mitigation for the more dangerous case.

## Metrics

| Repo             | Metric                           | Value                                                    | Notes                                                                                                                                                 |
| ---------------- | -------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| randsum-monorepo | Bare-except / silent-catch count | 0                                                        | grep for empty `catch (){}` in non-test src returns none; CLI `catch {}` blocks return a sensible default (empty stdin)                               |
| randsum-monorepo | Outbound calls missing timeouts  | N/A (libs) / low (bot)                                   | Libraries make no I/O. Bot's only outbound is discord.js (gateway + REST), which carries its own timeouts; `client.login` wrapped in capped backoff   |
| randsum-monorepo | Logging maturity                 | Structured (bot) / ad-hoc console (cli, deploy-commands) | Bot has JSON structured logger with Error serialization; `deploy-commands.ts` and `cli` use raw `console.*` (acceptable — one-shot script + CLI tool) |
| randsum-monorepo | Metrics maturity                 | Counters only                                            | In-process per-command invocation + error counters, flushed to log every 5 min. No histograms (no latency), no external metrics lib                   |
| randsum-monorepo | Tracing presence                 | None                                                     | No OTel/Jaeger/APM; structured error logs carry `interactionId`/`phase` correlation fields but no trace spans                                         |
| randsum-monorepo | SLO / SLI definitions            | None                                                     | No SLO file, no error-budget policy; code comments anticipate a future symptom-based alert                                                            |
| randsum-monorepo | Alerting maturity                | None                                                     | No PagerDuty/Opsgenie/alert rules. Metrics are forensic-only                                                                                          |
| randsum-monorepo | Health endpoint coverage         | None                                                     | Worker (no HTTP surface); no app-level heartbeat/watchdog                                                                                             |
| randsum-monorepo | Recurring defect themes          | None observed                                            | `runbooks/incidents/` empty (only `.gitkeep`); RCA template present and ready. Code-only assessment — no incident history to mine                     |

## Recommendations

- **R1** — Activate the error tracker: wire `forwardToSentry` to a real `Sentry.captureException` (or a lighter HTTP-DSN POST to stay dependency-thin), gated on `SENTRY_DSN`. Closes the gap where the "error tracker" currently only logs. [Horizon: now] [Risk reduction: Med]
- **R2** — Add an application-level liveness signal for the bot: instrument discord.js `shardDisconnect`/`shardReconnecting`/`shardError` into the logger + metrics, and add a lightweight watchdog (or a tiny `/healthz` HTTP listener converting the worker's implicit liveness into a probeable signal) so a stuck-but-alive gateway connection is detectable. [Horizon: next] [Risk reduction: Med]
- **R3** — Define one symptom-based alert from the existing metrics (e.g. command error-rate over a 5-min window, or absence of any `bot.ready`/`metrics.flush` line) and route it to a notification channel. The signal already exists; only the alert rule and routing are missing. [Horizon: next] [Risk reduction: Med]
- **R4** — Add unit tests for `loginWithBackoff` (exhaustion, cap, success-on-retry via the injectable `sleep`), `metrics` (flush/snapshot/timer lifecycle), `logger` (Error serialization, level→stream routing), and the `interactionCreate` error-reply fallback (replied/deferred branches). These are the components that only run under failure. [Horizon: next] [Risk reduction: Med]
- **R5** — Document a minimal SLO/SLI and error-budget one-liner for the bot (e.g. "best-effort, single-instance; target: respond to >99% of interactions; budget-exhaustion policy: investigate before adding commands") so the operational intent is captured, however modest. [Horizon: later] [Risk reduction: Lo]
- **R6** — Capture the missing-config failure path through `captureException` by moving `initErrorTracker()` ahead of (or restructuring) the `config.ts` import-time throw, so all boot failures land in one place. Minor consistency improvement. [Horizon: later] [Risk reduction: Lo]

## Confidence

Findings are **directly observable** from source, not LLM-inferred: the error
hierarchy (`errors.ts`), the bot's reliability utilities (`loginWithBackoff.ts`,
`errorTracker.ts`, `metrics.ts`, `logger.ts`, `interactionCreate.ts`), and
`render.yaml` were read in full. The empty-catch count (0), the absence of
health endpoints / SLO files / tracing / alerting / observability libraries, and
the absence of dedicated tests for the reliability utils were each verified by
grep across the repo (not sampled). The grade weighting reflects a **judgment
call**: most of the codebase is pure-computation libraries where service-uptime
reliability checks are genuinely N/A, so the grade is anchored on (a) error-surface
design quality across all packages — excellent — and (b) the single long-running
service's operational posture — good-but-incomplete. A service-only grade for the
bot in isolation would be roughly B−/C+ (solid resilience primitives, missing the
observability "last mile" of active error tracking, alerting, and health
signal). **Defect-signal analysis is code-only**: `runbooks/incidents/` is empty,
so no real-world recurring failure modes could be mined; a reliability gap that
only manifests in production (e.g. a gateway-reconnect edge case) would not be
visible to this static review. The "no missing timeouts" finding for the bot
relies on discord.js's internal timeout/reconnect handling, which was not
independently verified at the library-internals level.
