/**
 * Capped exponential backoff for the cold-start Discord login.
 *
 * A misconfigured (vs merely unreachable) Discord auth, combined with Render's
 * auto-restart, can otherwise produce a tight restart-crash loop. Retrying a few
 * times with a capped delay before letting the failure propagate spreads the
 * load and gives a transient outage a chance to recover, while still surfacing a
 * persistent auth failure to the platform.
 */
import { logger } from './logger.js'

export interface BackoffOptions {
  readonly maxAttempts?: number
  readonly baseDelayMs?: number
  readonly maxDelayMs?: number
  readonly sleep?: (ms: number) => Promise<void>
}

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_BASE_DELAY_MS = 1000
const DEFAULT_MAX_DELAY_MS = 30000

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Invoke `attempt` with capped exponential backoff. Resolves with the first
 * successful value; rejects with the final error after `maxAttempts` failures.
 */
export async function loginWithBackoff<T>(
  attempt: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  const sleep = options.sleep ?? defaultSleep

  const attempts = Array.from({ length: Math.max(maxAttempts, 1) }, (_, i) => i + 1)

  for (const attemptNumber of attempts) {
    try {
      // eslint-disable-next-line no-await-in-loop -- retries are inherently sequential
      return await attempt()
    } catch (error) {
      if (attemptNumber >= attempts.length) {
        logger.error('login.failed', {
          attempt: attemptNumber,
          maxAttempts: attempts.length,
          error
        })
        throw error instanceof Error ? error : new Error(String(error))
      }
      const delay = Math.min(baseDelayMs * 2 ** (attemptNumber - 1), maxDelayMs)
      logger.warn('login.retry', {
        attempt: attemptNumber,
        maxAttempts: attempts.length,
        nextDelayMs: delay,
        error
      })
      // eslint-disable-next-line no-await-in-loop -- backoff delay must block the next retry
      await sleep(delay)
    }
  }

  // Unreachable: the loop always returns on success or throws on the final
  // attempt. Present only to satisfy the explicit return type.
  throw new Error('login failed: exhausted all attempts')
}
