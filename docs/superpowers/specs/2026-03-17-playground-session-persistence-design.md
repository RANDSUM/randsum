# Playground Session Persistence

**Date:** 2026-03-17
**Status:** Approved
**Epic:** #938 (Interactive Playground)

## Problem

The playground at `playground.randsum.dev` needs shareable, persistent sessions so users can share notation configurations via URL. Currently, the `?n=` query param is ephemeral and lost on navigation.

## Requirements

- Visiting the bare URL shows a blank playground with no session
- First keystroke creates a persistent session with a unique URL
- Shared URLs load the saved notation
- Creator can edit; visitors see read-only with a Fork button
- No sign-in or authentication — ownership via claim token in localStorage
- Roll log is ephemeral (window-scoped), not persisted
- App remains fully static (no SSR)

## Architecture

**Persistence layer:** Supabase Direct (client-side `@supabase/supabase-js`).
**Project:** `randsum-playground` (`rcownsizpvjkzkgfcloe`), region `us-east-2`, org Jarvis Softworks.

### Data Model

One table:

```sql
create table public.sessions (
  id text primary key,            -- nanoid, 8 chars, URL-safe
  claim_token text not null,      -- secret, stored in creator's localStorage
  notation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_updated_at_idx on public.sessions (updated_at);
```

No user table. No auth. Sessions are anonymous.

### RLS Policies

```sql
alter table public.sessions enable row level security;

-- Anyone can read any session
create policy "Sessions are publicly readable"
  on public.sessions for select
  using (true);

-- Anyone can create a session (anon key)
create policy "Anyone can create sessions"
  on public.sessions for insert
  with check (true);

-- Only creator can update (claim_token must match)
create policy "Only creator can update"
  on public.sessions for update
  using (claim_token = current_setting('request.header.x-claim-token', true));

-- No deletes
```

**Claim token exclusion:** Client queries use explicit column selection (`select('id, notation, created_at, updated_at')`) to never expose claim tokens in read responses.

### URL Scheme

| URL | Behavior |
|-----|----------|
| `playground.randsum.dev` | Blank playground, no session |
| `playground.randsum.dev/s/abc123` | Load session `abc123` |

### Session Lifecycle

1. **Visit bare URL** — empty input, no session, no database call
2. **First keystroke** — generate nanoid + claim token, INSERT to Supabase, store claim token in `localStorage` under key `pg-claim:abc123`, push URL to `/s/abc123` via `history.pushState`
3. **Subsequent edits** — debounced UPDATE (500ms) with `x-claim-token` header
4. **Visit `/s/abc123`** — fetch session (notation only), check `localStorage` for `pg-claim:abc123`. Present = editable, absent = read-only
5. **Fork (read-only visitor)** — INSERT new session with current notation, new id + claim token, URL changes to `/s/xyz789`

### Client Integration

**New dependency:** `@supabase/supabase-js` in `apps/playground`

**Environment variables:**
- `PUBLIC_SUPABASE_URL` — project API URL
- `PUBLIC_SUPABASE_ANON_KEY` — public anon key (safe to expose)

**Client module** (`src/lib/supabase.ts`):
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)
```

**Session ID:** 8-character nanoid using URL-safe alphabet (`A-Za-z0-9_-`). The `nanoid` package (2KB) generates these.

**Claim token:** 32-character nanoid. Never sent over the wire except as `x-claim-token` header on UPDATE requests. Never returned in SELECT queries.

### Astro Routing

Single `index.astro` page serves as SPA entry point. The React app reads the session ID from `window.location.pathname` client-side by parsing `/s/{id}` from the path. This replaces the current `?n=` query param approach — sessions are the canonical URL scheme going forward.

Netlify redirect rule in `public/_redirects` ensures all `/s/*` paths serve `index.html` (SPA fallback):

```
/s/*  /index.html  200
```

The bare URL (`/`) continues to serve `index.html` directly via Astro's static build. The `?n=` param is no longer used — if present on load, it seeds the notation for a new session.

### PlaygroundApp State Changes

Current state:
```ts
interface PlaygroundState {
  notation: string
  validationState: ValidationState
  validationResult: ValidationResult | null
  rollResult: RollerRollResult | null
  selectedEntry: string | null
}
```

New state additions:
```ts
interface PlaygroundState {
  // ... existing fields ...
  sessionId: string | null        // null = no session yet
  readOnly: boolean               // true for visitors without claim token
}
```

New effects:
- `useEffect` on mount: parse session ID from URL path, fetch session if present, check localStorage for claim token
- `useEffect` on notation change (debounced): UPDATE session if we own it
- Fork handler: INSERT new session, update URL

### UI Changes

- **Read-only indicator:** When `readOnly = true`, input is disabled, "Fork" button appears in place of "Roll"
- **Share button:** Copy current URL to clipboard (always visible when session exists)
- **Fork button:** Visible in read-only mode, creates a new editable session with the same notation

### Debounce & Error Handling

**Debounce behavior:**
- Each keystroke resets a 500ms timer
- When the timer fires, send UPDATE with current notation
- On `beforeunload`, flush any pending update via `navigator.sendBeacon` or synchronous fetch
- Debounce is per-session (only one session active at a time)

**Error handling:**
- INSERT failure (first keystroke): retry silently up to 3 times with exponential backoff. If all fail, fall back to `?n=` query param mode (no session, but URL still shareable via notation)
- UPDATE failure (debounced edits): log to console, retry on next debounce tick. Do not interrupt the user
- SELECT failure (loading session): show inline message "Session not found" and offer to start a new session with the current URL's notation if available

### Security Considerations

This system provides **casual ownership**, not cryptographic security. It is appropriate for a low-stakes playground tool.

**Threat model:**
- Claim tokens are secrets stored in `localStorage` and sent as custom HTTP headers
- A user who inspects their own network traffic can extract their claim token — this is expected and acceptable
- `localStorage` is origin-scoped (`playground.randsum.dev`), so cross-site access is not possible
- Browser sync (iCloud Keychain, Chrome sync) does **not** sync `localStorage` across devices
- A user on the same device/browser profile has access to the same `localStorage` — this is a known limitation, acceptable for a playground

**What this does NOT protect against:**
- XSS attacks that read `localStorage` (mitigated by standard CSP headers)
- Server-side claim token extraction (claim tokens are stored in the database but never returned in SELECT queries)
- Claim token rotation or revocation (post-MVP feature)

**Post-MVP considerations:**
- Claim token rotation (regenerate on demand)
- Session expiration / TTL cleanup
- Optional real-time collaboration via Supabase Realtime

## Non-Goals

- User accounts or authentication
- Persisting roll history
- Session deletion or expiration (can add TTL cleanup later)
- Real-time collaboration (can add via Supabase Realtime later)
- Session listing or discovery

## Dependencies

- `@supabase/supabase-js` (~12KB gzipped)
- `nanoid` (~2KB gzipped)
- Supabase project `randsum-playground` (already created)

## Bundle Size Impact

~14KB gzipped added to the playground bundle. Current playground has no size-limit constraint in package.json.
