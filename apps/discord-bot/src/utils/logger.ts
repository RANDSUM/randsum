/**
 * Dependency-light structured logger.
 *
 * Emits one JSON line per event (level, timestamp, message, plus arbitrary
 * structured fields) to the appropriate console stream. This replaces ad-hoc
 * emoji-prefixed `console.warn`/`console.error` lines on the operational paths
 * so that Render logs can be aggregated, queried, and alerted on. Deliberately
 * no external dependency (no pino/winston) — a single function is enough for a
 * single-instance worker.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFields = Readonly<Record<string, unknown>>

type LogLine = LogFields & {
  readonly level: LogLevel
  readonly time: string
  readonly msg: string
}

function serialize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    }
  }
  return value
}

function normalizeFields(fields: LogFields): LogFields {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    out[key] = serialize(value)
  }
  return out
}

function emit(level: LogLevel, msg: string, fields: LogFields = {}): void {
  const line: LogLine = {
    level,
    time: new Date().toISOString(),
    msg,
    ...normalizeFields(fields)
  }
  const serialized = JSON.stringify(line)
  if (level === 'error') {
    console.error(serialized)
  } else {
    console.warn(serialized)
  }
}

export const logger: {
  debug: (msg: string, fields?: LogFields) => void
  info: (msg: string, fields?: LogFields) => void
  warn: (msg: string, fields?: LogFields) => void
  error: (msg: string, fields?: LogFields) => void
} = {
  debug: (msg, fields) => {
    emit('debug', msg, fields)
  },
  info: (msg, fields) => {
    emit('info', msg, fields)
  },
  warn: (msg, fields) => {
    emit('warn', msg, fields)
  },
  error: (msg, fields) => {
    emit('error', msg, fields)
  }
}
