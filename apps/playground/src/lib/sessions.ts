import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

type Client = ReturnType<typeof createClient>

export interface Session {
  readonly id: string
  readonly notation: string
  readonly created_at: string
  readonly updated_at: string
}

export interface CreateSessionResult {
  readonly session: Session
  readonly claimToken: string
}

function getClient(): Client {
  return createClient(
    String(import.meta.env.PUBLIC_SUPABASE_URL),
    String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY)
  )
}

function getClientWithClaimToken(claimToken: string): Client {
  return createClient(
    String(import.meta.env.PUBLIC_SUPABASE_URL),
    String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
    {
      global: {
        headers: {
          'x-claim-token': claimToken
        }
      }
    }
  )
}

// Retry helper: retries fn up to maxAttempts times with exponential backoff.
// baseMs = 0 disables delays (useful in tests).
async function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseMs: number
): Promise<T> {
  return withRetryFrom(fn, maxAttempts, baseMs, 0, undefined)
}

async function withRetryFrom<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseMs: number,
  attempt: number,
  lastError: unknown
): Promise<T> {
  if (attempt >= maxAttempts) throw lastError
  if (attempt > 0 && baseMs > 0) {
    await delay(baseMs * 4 ** (attempt - 1))
  }
  try {
    return await fn()
  } catch (err) {
    return withRetryFrom(fn, maxAttempts, baseMs, attempt + 1, err)
  }
}

async function createSessionOnce(notation: string): Promise<CreateSessionResult> {
  const id = nanoid(8)
  const claimToken = nanoid(32)
  const supabase = getClient()

  const row: never = { id, notation, claim_token: claimToken } as never
  const { data, error } = await supabase
    .from('sessions')
    .insert(row)
    .select('id, notation, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)

  return { session: data as Session, claimToken }
}

export async function createSession(notation: string): Promise<CreateSessionResult> {
  return withRetry(() => createSessionOnce(notation), 3, 100)
}

// Returns null if all retries are exhausted instead of throwing.
export async function createSessionSafe(notation: string): Promise<CreateSessionResult | null> {
  try {
    return await createSession(notation)
  } catch {
    return null
  }
}

export async function fetchSession(id: string): Promise<Session | null> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('id, notation, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data as Session
}

export async function updateSession(
  id: string,
  notation: string,
  claimToken: string
): Promise<void> {
  const supabase = getClientWithClaimToken(claimToken)

  const patch: never = { notation, updated_at: new Date().toISOString() } as never
  const { error } = await supabase.from('sessions').update(patch).eq('id', id)

  if (error) throw new Error(error.message)
}

export async function forkSession(notation: string): Promise<CreateSessionResult> {
  return createSession(notation)
}
